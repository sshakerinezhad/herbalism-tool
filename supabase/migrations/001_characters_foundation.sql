-- ============================================================================
-- Knights of Belyar - Phase 1: Characters Foundation
-- ============================================================================
-- This migration creates the core character system tables.
-- It does NOT modify existing herbalism tables yet (that's Phase 7).
-- ============================================================================

-- ============================================================================
-- REFERENCE TABLES (Static game data)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Skills Reference
-- ----------------------------------------------------------------------------
-- All 27 skills organized by their governing stat.
-- This is static reference data that doesn't change.

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  stat TEXT NOT NULL CHECK (stat IN ('str', 'dex', 'con', 'int', 'wis', 'cha', 'hon')),
  display_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE skills IS 'Reference table of all 27 skills in the Knights of Belyar system';

-- ----------------------------------------------------------------------------
-- Armor Slots Reference
-- ----------------------------------------------------------------------------
-- The 12 body slots and what armor types can occupy them.
-- Includes piece names and AC bonuses per armor type.

CREATE TABLE IF NOT EXISTS armor_slots (
  id SERIAL PRIMARY KEY,
  slot_key TEXT NOT NULL UNIQUE, -- 'head', 'neck', 'chest', etc.
  display_name TEXT NOT NULL,    -- 'Head', 'Neck', 'Chest', etc.
  slot_order INT NOT NULL,       -- 1-12 for display ordering
  
  -- Light armor availability and bonus
  light_available BOOLEAN NOT NULL DEFAULT FALSE,
  light_piece_name TEXT,         -- 'Helm', 'Padded Armor', etc.
  light_bonus INT,
  
  -- Medium armor availability and bonus
  medium_available BOOLEAN NOT NULL DEFAULT FALSE,
  medium_piece_name TEXT,
  medium_bonus INT,
  
  -- Heavy armor availability and bonus
  heavy_available BOOLEAN NOT NULL DEFAULT FALSE,
  heavy_piece_name TEXT,
  heavy_bonus INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE armor_slots IS 'Reference table defining the 12 body armor slots and their bonuses per armor type';

-- ============================================================================
-- CORE CHARACTER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE, -- 1:1 with auth user
  
  -- Identity
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  subrace TEXT,                  -- Culture for humans, subrace for others
  class TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  background TEXT NOT NULL CHECK (background IN ('native_knight', 'initiate')),
  previous_profession TEXT,      -- Only for initiates
  knight_order TEXT NOT NULL CHECK (knight_order IN (
    'fiendwreathers', 'ghastbreakers', 'beastwarks', 'angelflayers', 'dreamwalkers'
  )),
  vocation TEXT CHECK (vocation IN (
    'alchemist', 'blacksmith', 'herbalist', 'priest', 'runeseeker', 'scholar', 'spellscribe'
  )),                            -- NULL if they took a feat instead
  feat TEXT,                     -- NULL if they have a vocation
  touched_by_fate TEXT,          -- DM-assigned rare lineage
  
  -- Core Stats (7)
  str INT NOT NULL DEFAULT 10 CHECK (str >= 1),
  dex INT NOT NULL DEFAULT 10 CHECK (dex >= 1),
  con INT NOT NULL DEFAULT 10 CHECK (con >= 1),
  int INT NOT NULL DEFAULT 10 CHECK (int >= 1),
  wis INT NOT NULL DEFAULT 10 CHECK (wis >= 1),
  cha INT NOT NULL DEFAULT 10 CHECK (cha >= 1),
  hon INT NOT NULL DEFAULT 8 CHECK (hon >= 1),  -- Always starts at 8
  
  -- Combat
  hp_current INT NOT NULL,
  hp_custom_modifier INT NOT NULL DEFAULT 0,     -- For special circumstances
  hit_dice_current INT NOT NULL,
  
  -- Money
  platinum INT NOT NULL DEFAULT 0 CHECK (platinum >= 0),
  gold INT NOT NULL DEFAULT 0 CHECK (gold >= 0),
  silver INT NOT NULL DEFAULT 0 CHECK (silver >= 0),
  copper INT NOT NULL DEFAULT 0 CHECK (copper >= 0),
  
  -- Flavor
  appearance TEXT,
  artwork_url TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_vocation_or_feat CHECK (
    (vocation IS NOT NULL AND feat IS NULL) OR 
    (vocation IS NULL AND feat IS NOT NULL) OR
    (vocation IS NULL AND feat IS NULL)  -- Allow neither during creation wizard
  ),
  CONSTRAINT initiate_has_profession CHECK (
    background != 'initiate' OR previous_profession IS NOT NULL
  )
);

COMMENT ON TABLE characters IS 'Core character data for Knights of Belyar - 1:1 relationship with auth.users';

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

-- ============================================================================
-- CHARACTER RELATIONSHIP TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Character Skills (Proficiencies)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS character_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  skill_id INT REFERENCES skills(id) NOT NULL,
  is_proficient BOOLEAN NOT NULL DEFAULT FALSE,
  is_expertise BOOLEAN NOT NULL DEFAULT FALSE,  -- Double proficiency
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(character_id, skill_id)
);

COMMENT ON TABLE character_skills IS 'Junction table tracking which skills a character is proficient/expert in';

CREATE INDEX IF NOT EXISTS idx_character_skills_character ON character_skills(character_id);

-- ----------------------------------------------------------------------------
-- Character Armor (Equipped pieces)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS character_armor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  slot_id INT REFERENCES armor_slots(id) NOT NULL,
  armor_type TEXT NOT NULL CHECK (armor_type IN ('light', 'medium', 'heavy')),
  
  -- Custom piece details
  custom_name TEXT,              -- For named/special pieces (e.g., "Dragonscale Helm")
  material TEXT,                 -- Material (steel, mithril, etc.)
  is_magical BOOLEAN NOT NULL DEFAULT FALSE,
  properties JSONB,              -- Enchantments, runes, modifications
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(character_id, slot_id)  -- One piece per slot
);

COMMENT ON TABLE character_armor IS 'Armor pieces equipped by characters, one per body slot';

CREATE INDEX IF NOT EXISTS idx_character_armor_character ON character_armor(character_id);

-- ----------------------------------------------------------------------------
-- Character Weapons
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS character_weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  weapon_type TEXT,              -- 'martial', 'simple', etc.
  material TEXT NOT NULL DEFAULT 'Steel',
  damage_dice TEXT,              -- '1d8', '2d6', etc.
  damage_type TEXT,              -- 'slashing', 'piercing', 'bludgeoning'
  properties JSONB,              -- Versatile, two-handed, reach, etc.
  attachments JSONB,             -- Blacksmith modifications
  is_magical BOOLEAN NOT NULL DEFAULT FALSE,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE character_weapons IS 'Weapons owned by characters';

CREATE INDEX IF NOT EXISTS idx_character_weapons_character ON character_weapons(character_id);

-- ----------------------------------------------------------------------------
-- Character Items (General inventory)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS character_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  category TEXT,                 -- 'scroll', 'potion', 'gear', 'vocation_kit', etc.
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  properties JSONB,
  is_quick_access BOOLEAN NOT NULL DEFAULT FALSE,  -- Pinned for easy access on character sheet
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE character_items IS 'General inventory items owned by characters';

CREATE INDEX IF NOT EXISTS idx_character_items_character ON character_items(character_id);

-- ============================================================================
-- MIGRATION PREP: Add character_id to existing herbalism tables
-- ============================================================================
-- These columns are nullable for now. Phase 7 will migrate data and make them NOT NULL.

ALTER TABLE user_inventory 
  ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE user_brewed 
  ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE user_recipes 
  ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE CASCADE;

-- Indexes for the new character_id columns
CREATE INDEX IF NOT EXISTS idx_user_inventory_character ON user_inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_user_brewed_character ON user_brewed(character_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_character ON user_recipes(character_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically update the updated_at timestamp on row changes.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_armor_updated_at
  BEFORE UPDATE ON character_armor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_weapons_updated_at
  BEFORE UPDATE ON character_weapons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_items_updated_at
  BEFORE UPDATE ON character_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

