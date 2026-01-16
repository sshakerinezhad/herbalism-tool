CREATE OR REPLACE FUNCTION consume_character_item(
  p_character_id UUID,
  p_item_id UUID,
  p_quantity INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty INT;
  v_item_character_id UUID;
BEGIN
  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN json_build_object('error', 'Quantity must be positive');
  END IF;

  -- Verify ownership via auth.uid()
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Lock row and get current state
  SELECT quantity, character_id INTO v_current_qty, v_item_character_id
  FROM character_items WHERE id = p_item_id FOR UPDATE;

  IF v_item_character_id IS NULL THEN
    RETURN json_build_object('error', 'Item not found');
  END IF;
  IF v_item_character_id != p_character_id THEN
    RETURN json_build_object('error', 'Not your item');
  END IF;
  IF v_current_qty < p_quantity THEN
    RETURN json_build_object('error', 'Insufficient quantity');
  END IF;

  -- Perform mutation
  IF v_current_qty <= p_quantity THEN
    DELETE FROM character_items WHERE id = p_item_id;
  ELSE
    UPDATE character_items
    SET quantity = quantity - p_quantity, updated_at = NOW()
    WHERE id = p_item_id;
  END IF;

  RETURN json_build_object('success', true);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION consume_character_item TO authenticated;
