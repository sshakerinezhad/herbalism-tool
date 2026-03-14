-- ============================================================================
-- MIGRATION 013: Rename 'oil' → 'balm' everywhere
-- ============================================================================
-- Balms are weapon-coating preparations (matching EPG terminology).
-- This is a full rename: data, constraints, functions, and comments.
-- ============================================================================

-- Step 1: Drop old CHECK constraint (must happen before data update)
ALTER TABLE character_brewed DROP CONSTRAINT IF EXISTS character_brewed_type_check;

-- Step 2: Update existing data
UPDATE character_brewed SET type = 'balm' WHERE type = 'oil';
UPDATE recipes SET type = 'balm' WHERE type = 'oil';

-- Step 3: Add new CHECK constraint with 'balm'
ALTER TABLE character_brewed ADD CONSTRAINT character_brewed_type_check
  CHECK (type IN ('elixir', 'bomb', 'balm'));

-- Step 3: Replace brew_items function with 'balm' validation
CREATE OR REPLACE FUNCTION brew_items(
  p_character_id UUID,
  p_herbs_to_remove JSONB,
  p_brew_type TEXT,
  p_effects JSONB,
  p_computed_description TEXT,
  p_choices JSONB DEFAULT '{}'::jsonb,
  p_success_count INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_herb JSONB;
  v_herb_id INT;
  v_quantity INT;
  v_current_quantity INT;
BEGIN
  -- Ownership check
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validate brew type
  IF p_brew_type NOT IN ('elixir', 'bomb', 'balm') THEN
    RETURN json_build_object('error', 'Invalid brew type');
  END IF;

  -- Validate success count
  IF p_success_count < 0 THEN
    RETURN json_build_object('error', 'Invalid success count');
  END IF;

  -- Step 1: Validate and lock all herbs
  FOR v_herb IN SELECT * FROM jsonb_array_elements(p_herbs_to_remove)
  LOOP
    v_herb_id := (v_herb->>'herb_id')::INT;
    v_quantity := (v_herb->>'quantity')::INT;

    -- Lock row and check quantity
    SELECT quantity INTO v_current_quantity
    FROM character_herbs
    WHERE character_id = p_character_id AND herb_id = v_herb_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN json_build_object('error', 'Herb not found: ' || v_herb_id);
    END IF;

    IF v_current_quantity < v_quantity THEN
      RETURN json_build_object('error', 'Not enough herbs: ' || v_herb_id);
    END IF;
  END LOOP;

  -- Step 2: Remove herbs
  FOR v_herb IN SELECT * FROM jsonb_array_elements(p_herbs_to_remove)
  LOOP
    v_herb_id := (v_herb->>'herb_id')::INT;
    v_quantity := (v_herb->>'quantity')::INT;

    UPDATE character_herbs
    SET quantity = quantity - v_quantity,
        updated_at = NOW()
    WHERE character_id = p_character_id AND herb_id = v_herb_id;

    -- Clean up zero-quantity rows
    DELETE FROM character_herbs
    WHERE character_id = p_character_id AND herb_id = v_herb_id AND quantity <= 0;
  END LOOP;

  -- Step 3: Create brewed items (only if successful)
  IF p_success_count > 0 THEN
    INSERT INTO character_brewed (character_id, type, effects, computed_description, choices, quantity)
    VALUES (p_character_id, p_brew_type, p_effects, p_computed_description, p_choices, p_success_count);
  END IF;

  RETURN json_build_object('items_created', p_success_count);
END;
$$;

-- Step 4: Update comments
COMMENT ON TABLE character_brewed IS 'Brewed items (elixirs, bombs, balms) created by a character.';
COMMENT ON FUNCTION brew_items IS 'Atomically brew items: validate herbs, remove them, create brewed items. Rolls back on any failure.';
