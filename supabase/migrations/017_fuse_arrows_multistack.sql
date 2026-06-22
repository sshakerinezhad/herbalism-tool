-- Fix: fuse_bombs_to_arrows must consume base arrows across ALL stacks, not just the
-- largest single stack. Previously a player with multiple base-arrow stacks (e.g. 5 + 3)
-- could see a cap of 8 in the UI but the RPC only drew from one stack and errored.
-- Signature unchanged (no type regen needed).

CREATE OR REPLACE FUNCTION fuse_bombs_to_arrows(
  p_character_id UUID,
  p_brewed_id BIGINT,
  p_count INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bomb RECORD;
  v_arrow RECORD;
  v_total INT;
  v_remaining INT;
  v_take INT;
  v_effects JSONB;
  v_choices JSONB;
  v_label TEXT;
  v_existing_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM characters WHERE id = p_character_id AND user_id = auth.uid()) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;
  IF p_count <= 0 THEN
    RETURN json_build_object('error', 'Invalid count');
  END IF;

  -- Lock + validate bomb
  SELECT * INTO v_bomb FROM character_brewed
   WHERE id = p_brewed_id AND character_id = p_character_id AND type = 'bomb'
   FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Bomb not found'); END IF;
  IF v_bomb.quantity < p_count THEN RETURN json_build_object('error', 'Not enough bombs'); END IF;

  -- Lock all base-arrow stacks, then validate the TOTAL across them is enough
  PERFORM 1 FROM character_items
   WHERE character_id = p_character_id AND category = 'ammo' AND ammo_type = 'arrow'
     AND (properties IS NULL OR properties->>'source' IS NULL)
   FOR UPDATE;

  SELECT COALESCE(SUM(quantity), 0) INTO v_total
  FROM character_items
   WHERE character_id = p_character_id AND category = 'ammo' AND ammo_type = 'arrow'
     AND (properties IS NULL OR properties->>'source' IS NULL);

  IF v_total < p_count THEN RETURN json_build_object('error', 'Not enough base arrows'); END IF;

  v_effects := v_bomb.effects;
  v_choices := COALESCE(v_bomb.choices, '{}'::jsonb);
  v_label   := 'Arrow of ' || COALESCE(v_bomb.computed_description, 'Bomb');

  -- Decrement bomb
  IF v_bomb.quantity = p_count THEN
    DELETE FROM character_brewed WHERE id = p_brewed_id;
  ELSE
    UPDATE character_brewed SET quantity = quantity - p_count, updated_at = NOW() WHERE id = p_brewed_id;
  END IF;

  -- Consume base arrows across stacks (smallest first so partial stacks clear)
  v_remaining := p_count;
  FOR v_arrow IN
    SELECT id, quantity FROM character_items
     WHERE character_id = p_character_id AND category = 'ammo' AND ammo_type = 'arrow'
       AND (properties IS NULL OR properties->>'source' IS NULL)
     ORDER BY quantity ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_arrow.quantity, v_remaining);
    IF v_take = v_arrow.quantity THEN
      DELETE FROM character_items WHERE id = v_arrow.id;
    ELSE
      UPDATE character_items SET quantity = quantity - v_take, updated_at = NOW() WHERE id = v_arrow.id;
    END IF;
    v_remaining := v_remaining - v_take;
  END LOOP;

  -- Upsert matching special-arrow stack
  SELECT id INTO v_existing_id FROM character_items
   WHERE character_id = p_character_id AND category = 'ammo' AND ammo_type = 'arrow'
     AND properties->>'source' = 'fused_bomb'
     AND properties->'effects' = v_effects
     AND COALESCE(properties->'choices', '{}'::jsonb) = v_choices
   FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    UPDATE character_items SET quantity = quantity + p_count, updated_at = NOW() WHERE id = v_existing_id;
  ELSE
    INSERT INTO character_items (character_id, name, category, quantity, ammo_type, properties)
    VALUES (p_character_id, v_label, 'ammo', p_count, 'arrow',
            jsonb_build_object('source','fused_bomb','effects',v_effects,'choices',v_choices));
  END IF;

  RETURN json_build_object('success', true, 'arrows_created', p_count);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;
