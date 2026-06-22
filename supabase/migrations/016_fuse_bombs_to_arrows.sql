-- Special arrows: fuse N bombs onto N base arrows -> N special arrows.
-- Base arrow = character_items (category='ammo', ammo_type='arrow') with no fused source.
-- Special arrow = same, with properties.source='fused_bomb'. 1 bomb + 1 base arrow -> 1 special arrow.
-- Atomic (FOR UPDATE locks), mirrors brew_items (migration 009).

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
  v_base RECORD;
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

  -- Lock + validate base arrows (largest plain-arrow stack)
  SELECT * INTO v_base FROM character_items
   WHERE character_id = p_character_id AND category = 'ammo' AND ammo_type = 'arrow'
     AND (properties IS NULL OR properties->>'source' IS NULL)
   ORDER BY quantity DESC LIMIT 1
   FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('error', 'No base arrows'); END IF;
  IF v_base.quantity < p_count THEN RETURN json_build_object('error', 'Not enough base arrows'); END IF;

  v_effects := v_bomb.effects;
  v_choices := COALESCE(v_bomb.choices, '{}'::jsonb);
  v_label   := 'Arrow of ' || COALESCE(v_bomb.computed_description, 'Bomb');

  -- Decrement bomb
  IF v_bomb.quantity = p_count THEN
    DELETE FROM character_brewed WHERE id = p_brewed_id;
  ELSE
    UPDATE character_brewed SET quantity = quantity - p_count, updated_at = NOW() WHERE id = p_brewed_id;
  END IF;

  -- Decrement base arrows
  IF v_base.quantity = p_count THEN
    DELETE FROM character_items WHERE id = v_base.id;
  ELSE
    UPDATE character_items SET quantity = quantity - p_count, updated_at = NOW() WHERE id = v_base.id;
  END IF;

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

COMMENT ON FUNCTION fuse_bombs_to_arrows IS 'Atomically fuse N bombs onto N base arrows -> N special arrows.';
