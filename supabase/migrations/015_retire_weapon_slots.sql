-- Retire the Elden-Ring weapon-slot system. Equipped weapons now use
-- character_weapons.is_equipped. character_quick_slots stays.

-- 1. Rewrite the new-character init to only seed quick slots.
CREATE OR REPLACE FUNCTION initialize_character_slots()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO character_quick_slots (character_id, slot_number)
  VALUES (NEW.id, 1), (NEW.id, 2), (NEW.id, 3),
         (NEW.id, 4), (NEW.id, 5), (NEW.id, 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop weapon-slot policies, trigger, indexes, table.
DROP TRIGGER IF EXISTS update_weapon_slots_updated_at ON character_weapon_slots;
DROP POLICY IF EXISTS "Users can view own weapon slots" ON character_weapon_slots;
DROP POLICY IF EXISTS "Users can manage own weapon slots" ON character_weapon_slots;
DROP POLICY IF EXISTS "Users can update own weapon slots" ON character_weapon_slots;
DROP POLICY IF EXISTS "Users can delete own weapon slots" ON character_weapon_slots;
DROP INDEX IF EXISTS idx_weapon_slots_character;
DROP INDEX IF EXISTS idx_weapon_slots_weapon;
DROP TABLE IF EXISTS character_weapon_slots;
