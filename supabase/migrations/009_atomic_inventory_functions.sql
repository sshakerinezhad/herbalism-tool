-- ============================================================================
-- ATOMIC INVENTORY MUTATION FUNCTIONS
-- ============================================================================
-- Replaces SELECT-then-modify patterns with atomic RPC functions.
-- Uses row locking (FOR UPDATE) to prevent race conditions.
-- Uses SECURITY DEFINER to bypass RLS with manual ownership checks.
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: Add Character Herbs (Atomic Upsert)
-- ============================================================================
-- Atomically adds herbs to a character's inventory using INSERT ON CONFLICT.
-- Returns error if unauthorized.

CREATE OR REPLACE FUNCTION add_character_herbs(
  p_character_id UUID,
  p_herb_id INT,
  p_quantity INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ownership check (RLS bypass requires manual auth)
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN json_build_object('error', 'Quantity must be positive');
  END IF;

  -- Atomic upsert
  INSERT INTO character_herbs (character_id, herb_id, quantity)
  VALUES (p_character_id, p_herb_id, p_quantity)
  ON CONFLICT (character_id, herb_id)
  DO UPDATE SET
    quantity = character_herbs.quantity + EXCLUDED.quantity,
    updated_at = NOW();

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION add_character_herbs IS 'Atomically add herbs to character inventory with ownership check';

-- ============================================================================
-- FUNCTION 2: Remove Character Herbs (Atomic with Row Lock)
-- ============================================================================
-- Atomically removes herbs from inventory with validation.
-- Uses FOR UPDATE to lock the row and prevent race conditions.

CREATE OR REPLACE FUNCTION remove_character_herbs(
  p_character_id UUID,
  p_herb_id INT,
  p_quantity INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_quantity INT;
BEGIN
  -- Ownership check
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN json_build_object('error', 'Quantity must be positive');
  END IF;

  -- Lock row and get current quantity
  SELECT quantity INTO v_current_quantity
  FROM character_herbs
  WHERE character_id = p_character_id AND herb_id = p_herb_id
  FOR UPDATE;

  -- Check if herb exists
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Herb not found in inventory');
  END IF;

  -- Check if sufficient quantity
  IF v_current_quantity < p_quantity THEN
    RETURN json_build_object('error', 'Insufficient herbs');
  END IF;

  -- Remove or reduce quantity
  IF v_current_quantity = p_quantity THEN
    DELETE FROM character_herbs
    WHERE character_id = p_character_id AND herb_id = p_herb_id;
  ELSE
    UPDATE character_herbs
    SET quantity = quantity - p_quantity, updated_at = NOW()
    WHERE character_id = p_character_id AND herb_id = p_herb_id;
  END IF;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION remove_character_herbs IS 'Atomically remove herbs from character inventory with row locking';

-- ============================================================================
-- FUNCTION 3: Consume Character Brewed Item (Atomic with Row Lock)
-- ============================================================================
-- Atomically consumes brewed items with validation.
-- Uses FOR UPDATE to lock the row.

CREATE OR REPLACE FUNCTION consume_character_brewed_item(
  p_brewed_id INT,
  p_quantity INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_quantity INT;
  v_character_id UUID;
BEGIN
  -- Lock row and get current quantity + character_id
  SELECT quantity, character_id INTO v_current_quantity, v_character_id
  FROM character_brewed
  WHERE id = p_brewed_id
  FOR UPDATE;

  -- Check if item exists
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Brewed item not found');
  END IF;

  -- Ownership check
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = v_character_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN json_build_object('error', 'Quantity must be positive');
  END IF;

  -- Check if sufficient quantity
  IF v_current_quantity < p_quantity THEN
    RETURN json_build_object('error', 'Insufficient items');
  END IF;

  -- Remove or reduce quantity
  IF v_current_quantity = p_quantity THEN
    DELETE FROM character_brewed
    WHERE id = p_brewed_id;
  ELSE
    UPDATE character_brewed
    SET quantity = quantity - p_quantity, updated_at = NOW()
    WHERE id = p_brewed_id;
  END IF;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION consume_character_brewed_item IS 'Atomically consume brewed items with row locking';

-- ============================================================================
-- FUNCTION 4: Brew Items (Atomic Multi-Step Transaction)
-- ============================================================================
-- Atomically performs the entire brewing operation:
-- 1. Validates and locks all required herbs
-- 2. Removes herbs from inventory
-- 3. Creates brewed items based on success count
-- If any step fails, entire transaction rolls back.
--
-- Parameters:
--   p_character_id: Character performing the brew
--   p_herbs_to_remove: JSONB array of {herb_id, quantity} objects
--   p_brew_type: 'elixir', 'bomb', or 'oil'
--   p_effects: JSONB array of effect names
--   p_computed_description: Generated description
--   p_choices: JSONB object of user choices
--   p_success_count: Number of successful brews (from dice rolls)

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
  IF p_brew_type NOT IN ('elixir', 'bomb', 'oil') THEN
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
      RETURN json_build_object('error', 'Insufficient herbs: ' || v_herb_id);
    END IF;
  END LOOP;

  -- Step 2: Remove herbs (all locks acquired, safe to proceed)
  FOR v_herb IN SELECT * FROM jsonb_array_elements(p_herbs_to_remove)
  LOOP
    v_herb_id := (v_herb->>'herb_id')::INT;
    v_quantity := (v_herb->>'quantity')::INT;

    SELECT quantity INTO v_current_quantity
    FROM character_herbs
    WHERE character_id = p_character_id AND herb_id = v_herb_id;

    IF v_current_quantity = v_quantity THEN
      DELETE FROM character_herbs
      WHERE character_id = p_character_id AND herb_id = v_herb_id;
    ELSE
      UPDATE character_herbs
      SET quantity = quantity - v_quantity, updated_at = NOW()
      WHERE character_id = p_character_id AND herb_id = v_herb_id;
    END IF;
  END LOOP;

  -- Step 3: Create brewed items for each success
  IF p_success_count > 0 THEN
    INSERT INTO character_brewed (
      character_id,
      type,
      effects,
      computed_description,
      choices,
      quantity
    ) VALUES (
      p_character_id,
      p_brew_type,
      p_effects,
      p_computed_description,
      p_choices,
      p_success_count
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'items_created', p_success_count
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on exception
    RETURN json_build_object('error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION brew_items IS 'Atomically brew items: validate herbs, remove them, create brewed items. Rolls back on any failure.';

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================
-- Allow authenticated users to call these functions

GRANT EXECUTE ON FUNCTION add_character_herbs TO authenticated;
GRANT EXECUTE ON FUNCTION remove_character_herbs TO authenticated;
GRANT EXECUTE ON FUNCTION consume_character_brewed_item TO authenticated;
GRANT EXECUTE ON FUNCTION brew_items TO authenticated;
