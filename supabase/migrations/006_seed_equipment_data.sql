-- ============================================================================
-- Seed Equipment Data for Testing
-- ============================================================================
-- Adds sample weapons and items for testing the equipment system.
-- This data is linked to existing characters.
-- ============================================================================

-- ============================================================================
-- SAMPLE WEAPONS
-- ============================================================================
-- Add weapons to existing characters (if any exist)

DO $$
DECLARE
  char_record RECORD;
BEGIN
  FOR char_record IN SELECT id FROM characters LIMIT 1 LOOP
    -- Only insert if character doesn't already have weapons
    IF NOT EXISTS (SELECT 1 FROM character_weapons WHERE character_id = char_record.id) THEN
      INSERT INTO character_weapons (character_id, name, weapon_type, material, damage_dice, damage_type, is_magical, is_two_handed, notes)
      VALUES
        -- Melee weapons
        (char_record.id, 'Longsword', 'martial', 'Steel', '1d8', 'slashing', FALSE, FALSE, 'A versatile blade, can be used two-handed for 1d10'),
        (char_record.id, 'Shortsword', 'martial', 'Steel', '1d6', 'piercing', FALSE, FALSE, 'Light, finesse weapon'),
        (char_record.id, 'Handaxe', 'simple', 'Iron', '1d6', 'slashing', FALSE, FALSE, 'Light, can be thrown'),
        (char_record.id, 'Dagger', 'simple', 'Steel', '1d4', 'piercing', FALSE, FALSE, 'Finesse, light, thrown'),
        (char_record.id, 'Mace', 'simple', 'Iron', '1d6', 'bludgeoning', FALSE, FALSE, 'Reliable blunt weapon'),
        
        -- Two-handed weapons
        (char_record.id, 'Greatsword', 'martial', 'Steel', '2d6', 'slashing', FALSE, TRUE, 'Heavy, two-handed'),
        (char_record.id, 'Longbow', 'martial', 'Yew', '1d8', 'piercing', FALSE, TRUE, 'Two-handed, range 150/600'),
        
        -- Magical weapons
        (char_record.id, 'Flame Tongue', 'martial', 'Enchanted Steel', '1d8+2d6', 'slashing/fire', TRUE, FALSE, 'Speaks "Ignite!" to engulf blade in flames'),
        
        -- Shields (defensive, no damage)
        (char_record.id, 'Wooden Shield', 'shield', 'Oak', NULL, NULL, FALSE, FALSE, '+2 AC when equipped in off-hand');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SAMPLE ITEMS
-- ============================================================================
-- Add consumables and gear to existing characters

DO $$
DECLARE
  char_record RECORD;
BEGIN
  FOR char_record IN SELECT id FROM characters LIMIT 1 LOOP
    -- Only insert if character doesn't already have items
    IF NOT EXISTS (SELECT 1 FROM character_items WHERE character_id = char_record.id) THEN
      INSERT INTO character_items (character_id, name, category, quantity, is_quick_access, ammo_type, notes)
      VALUES
        -- Potions
        (char_record.id, 'Health Potion', 'potion', 3, TRUE, NULL, 'Heals 2d4+2 HP'),
        (char_record.id, 'Greater Health Potion', 'potion', 1, TRUE, NULL, 'Heals 4d4+4 HP'),
        (char_record.id, 'Antidote', 'potion', 2, TRUE, NULL, 'Cures poison'),
        
        -- Ammunition
        (char_record.id, 'Arrows', 'ammo', 40, FALSE, 'arrow', 'Standard arrows for longbow'),
        (char_record.id, 'Fire Arrows', 'ammo', 10, FALSE, 'arrow', '+1d4 fire damage on hit'),
        (char_record.id, 'Crossbow Bolts', 'ammo', 20, FALSE, 'bolt', 'Standard crossbow bolts'),
        
        -- Scrolls
        (char_record.id, 'Scroll of Fireball', 'scroll', 1, TRUE, NULL, 'Cast Fireball (3rd level)'),
        (char_record.id, 'Scroll of Shield', 'scroll', 2, TRUE, NULL, 'Cast Shield as a reaction'),
        
        -- Gear
        (char_record.id, 'Rope (50ft)', 'gear', 1, FALSE, NULL, 'Hemp rope'),
        (char_record.id, 'Torch', 'gear', 5, FALSE, NULL, 'Bright light 20ft, dim light 40ft'),
        (char_record.id, 'Caltrops', 'gear', 2, TRUE, NULL, 'Bag of 20, covers 5ft square'),
        (char_record.id, 'Healer''s Kit', 'gear', 1, FALSE, NULL, '10 uses, stabilize dying creatures'),
        
        -- Food
        (char_record.id, 'Rations', 'food', 10, FALSE, NULL, 'Days worth of trail food'),
        (char_record.id, 'Goodberry', 'food', 5, TRUE, NULL, 'Magical berry, heals 1 HP and provides sustenance');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Output
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Seed data added for equipment testing';
END $$;


