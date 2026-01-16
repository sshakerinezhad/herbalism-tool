-- ============================================================================
-- Knights of Belyar - Equipment Slots System
-- ============================================================================
-- Adds weapon slots (Elden Ring style) and quick slots for combat items.
-- ============================================================================

-- ============================================================================
-- WEAPON SLOTS (Elden Ring style: 3 per hand)
-- ============================================================================
-- Players can equip up to 3 weapons per hand and cycle through them in combat.
-- Two-handed weapons occupy the right hand and "lock" the left hand.

CREATE TABLE IF NOT EXISTS character_weapon_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  
  hand TEXT NOT NULL CHECK (hand IN ('right', 'left')),
  slot_number INT NOT NULL CHECK (slot_number >= 1 AND slot_number <= 3),
  
  -- Reference to the actual weapon (NULL = empty slot)
  weapon_id UUID REFERENCES character_weapons(id) ON DELETE SET NULL,
  
  -- Which slot is currently "active" in combat
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- For ranged weapons: which ammo type is selected
  selected_ammo_id UUID REFERENCES character_items(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each character has exactly one slot per hand+number combination
  UNIQUE(character_id, hand, slot_number)
);

COMMENT ON TABLE character_weapon_slots IS 'Weapon equipment slots - 3 per hand, Elden Ring style cycling';

CREATE INDEX IF NOT EXISTS idx_weapon_slots_character ON character_weapon_slots(character_id);
CREATE INDEX IF NOT EXISTS idx_weapon_slots_weapon ON character_weapon_slots(weapon_id);

-- ============================================================================
-- QUICK SLOTS (Combat inventory - 6 slots)
-- ============================================================================
-- Items pinned for quick access during combat (potions, bombs, scrolls, etc.)

CREATE TABLE IF NOT EXISTS character_quick_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  
  slot_number INT NOT NULL CHECK (slot_number >= 1 AND slot_number <= 6),
  
  -- Reference to the item (NULL = empty slot)
  item_id UUID REFERENCES character_items(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each character has exactly one item per slot number
  UNIQUE(character_id, slot_number)
);

COMMENT ON TABLE character_quick_slots IS 'Quick access slots for combat items - potions, bombs, scrolls, etc.';

CREATE INDEX IF NOT EXISTS idx_quick_slots_character ON character_quick_slots(character_id);
CREATE INDEX IF NOT EXISTS idx_quick_slots_item ON character_quick_slots(item_id);

-- ============================================================================
-- ADD TWO-HANDED TRACKING TO WEAPONS
-- ============================================================================
-- Add a field to track if a weapon is two-handed (locks the off-hand)

ALTER TABLE character_weapons 
  ADD COLUMN IF NOT EXISTS is_two_handed BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- ADD AMMO CATEGORY AND WEAPON ASSOCIATION
-- ============================================================================
-- Ammo items need to know what weapon types they work with

ALTER TABLE character_items 
  ADD COLUMN IF NOT EXISTS ammo_type TEXT; -- 'arrow', 'bolt', 'bullet', etc.

COMMENT ON COLUMN character_items.ammo_type IS 'For ammo items: what type of ammo (arrow, bolt, etc.)';

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_weapon_slots_updated_at
  BEFORE UPDATE ON character_weapon_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_slots_updated_at
  BEFORE UPDATE ON character_quick_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE character_weapon_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_quick_slots ENABLE ROW LEVEL SECURITY;

-- Weapon Slots: Owner-only access
CREATE POLICY "Users can view own weapon slots"
  ON character_weapon_slots FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own weapon slots"
  ON character_weapon_slots FOR INSERT
  TO authenticated
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own weapon slots"
  ON character_weapon_slots FOR UPDATE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own weapon slots"
  ON character_weapon_slots FOR DELETE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Quick Slots: Owner-only access
CREATE POLICY "Users can view own quick slots"
  ON character_quick_slots FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own quick slots"
  ON character_quick_slots FOR INSERT
  TO authenticated
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quick slots"
  ON character_quick_slots FOR UPDATE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own quick slots"
  ON character_quick_slots FOR DELETE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- INITIALIZE EMPTY SLOTS FOR NEW CHARACTERS (Optional trigger)
-- ============================================================================
-- When a character is created, pre-populate their 6 weapon slots and 6 quick slots.
-- This makes querying simpler (slots always exist, just may be empty).

CREATE OR REPLACE FUNCTION initialize_character_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 6 weapon slots (3 right hand, 3 left hand)
  INSERT INTO character_weapon_slots (character_id, hand, slot_number, is_active)
  VALUES 
    (NEW.id, 'right', 1, TRUE),  -- First right slot is active by default
    (NEW.id, 'right', 2, FALSE),
    (NEW.id, 'right', 3, FALSE),
    (NEW.id, 'left', 1, TRUE),   -- First left slot is active by default
    (NEW.id, 'left', 2, FALSE),
    (NEW.id, 'left', 3, FALSE);
  
  -- Create 6 quick slots (all empty)
  INSERT INTO character_quick_slots (character_id, slot_number)
  VALUES 
    (NEW.id, 1),
    (NEW.id, 2),
    (NEW.id, 3),
    (NEW.id, 4),
    (NEW.id, 5),
    (NEW.id, 6);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_character_slots
  AFTER INSERT ON characters
  FOR EACH ROW EXECUTE FUNCTION initialize_character_slots();

-- ============================================================================
-- BACKFILL: Create slots for existing characters
-- ============================================================================
-- Run this once to add slots for any characters created before this migration.

DO $$
DECLARE
  char_record RECORD;
BEGIN
  FOR char_record IN SELECT id FROM characters LOOP
    -- Only insert if slots don't exist
    INSERT INTO character_weapon_slots (character_id, hand, slot_number, is_active)
    VALUES 
      (char_record.id, 'right', 1, TRUE),
      (char_record.id, 'right', 2, FALSE),
      (char_record.id, 'right', 3, FALSE),
      (char_record.id, 'left', 1, TRUE),
      (char_record.id, 'left', 2, FALSE),
      (char_record.id, 'left', 3, FALSE)
    ON CONFLICT (character_id, hand, slot_number) DO NOTHING;
    
    INSERT INTO character_quick_slots (character_id, slot_number)
    VALUES 
      (char_record.id, 1),
      (char_record.id, 2),
      (char_record.id, 3),
      (char_record.id, 4),
      (char_record.id, 5),
      (char_record.id, 6)
    ON CONFLICT (character_id, slot_number) DO NOTHING;
  END LOOP;
END $$;


