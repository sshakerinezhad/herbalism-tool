-- ============================================================================
-- Quick Slots: Add Brewed Item Support
-- ============================================================================
-- Allows quick slots to reference brewed items (elixirs, bombs, oils) 
-- from the herbalism system in addition to regular character items.
-- ============================================================================

-- Add brewed_item_id column to reference user_brewed table
-- A quick slot can have EITHER item_id (regular item) OR brewed_item_id (brewed), not both
ALTER TABLE character_quick_slots 
  ADD COLUMN IF NOT EXISTS brewed_item_id INTEGER REFERENCES user_brewed(id) ON DELETE SET NULL;

COMMENT ON COLUMN character_quick_slots.brewed_item_id IS 'Reference to a brewed item (elixir/bomb/oil). Mutually exclusive with item_id.';

-- Add index for brewed item lookups
CREATE INDEX IF NOT EXISTS idx_quick_slots_brewed_item ON character_quick_slots(brewed_item_id);

-- ============================================================================
-- Constraint: Ensure only one type of item per slot
-- ============================================================================
-- A slot should have either item_id OR brewed_item_id, not both

ALTER TABLE character_quick_slots
  ADD CONSTRAINT check_single_item_type 
  CHECK (
    (item_id IS NULL AND brewed_item_id IS NULL) OR  -- Empty slot
    (item_id IS NOT NULL AND brewed_item_id IS NULL) OR  -- Regular item
    (item_id IS NULL AND brewed_item_id IS NOT NULL)     -- Brewed item
  );

-- ============================================================================
-- Also populate character_id on user_brewed for existing data
-- ============================================================================
-- This links brewed items to characters (for users who have both)

UPDATE user_brewed ub
SET character_id = c.id
FROM characters c
WHERE ub.user_id = c.user_id
  AND ub.character_id IS NULL;


