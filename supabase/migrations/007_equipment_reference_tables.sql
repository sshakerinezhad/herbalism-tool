-- ============================================================================
-- Equipment Reference Tables - Clean, Scalable Architecture
-- ============================================================================
-- This migration creates proper reference tables for weapons, materials, and items.
-- Characters own INSTANCES that reference these templates, not raw strings.
-- 
-- Architecture:
--   weapon_templates  →  character_weapons (instance with customizations)
--   materials         →  character_weapons.material_id
--   item_templates    →  character_items (instance with quantity)
-- ============================================================================

-- ============================================================================
-- WEAPON CATEGORIES
-- ============================================================================

CREATE TYPE weapon_category AS ENUM (
  'simple_melee',
  'simple_ranged',
  'martial_melee',
  'martial_ranged'
);

CREATE TYPE damage_type AS ENUM (
  'slashing',
  'piercing',
  'bludgeoning',
  'fire',
  'cold',
  'lightning',
  'acid',
  'poison',
  'necrotic',
  'radiant',
  'force',
  'psychic',
  'thunder'
);

-- ============================================================================
-- MATERIALS REFERENCE TABLE
-- ============================================================================
-- Materials define what a weapon/armor is made of.
-- Each material can have special properties that affect gameplay.

CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tier INT NOT NULL DEFAULT 1, -- 1=common, 2=uncommon, 3=rare, 4=very_rare, 5=legendary
  
  -- Combat modifiers
  damage_bonus INT DEFAULT 0,
  attack_bonus INT DEFAULT 0,
  ac_bonus INT DEFAULT 0,
  
  -- Special properties (JSON for flexibility)
  properties JSONB DEFAULT '{}',
  -- Example: {"silvered": true, "bypasses_resistance": ["necrotic"]}
  
  -- Flavor
  description TEXT,
  cost_multiplier DECIMAL(6,2) DEFAULT 1.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE materials IS 'Reference table for weapon/armor materials with their properties';

-- Seed materials
INSERT INTO materials (name, tier, damage_bonus, attack_bonus, properties, description, cost_multiplier) VALUES
  -- Tier 1: Common
  ('Iron', 1, 0, 0, '{}', 'Standard iron, prone to rust but readily available.', 0.8),
  ('Steel', 1, 0, 0, '{}', 'Well-forged steel, the standard for quality weapons.', 1.0),
  ('Bronze', 1, 0, 0, '{}', 'Ancient alloy, still serviceable.', 0.9),
  ('Wood', 1, 0, 0, '{}', 'Hardwood, used for staves and clubs.', 0.5),
  ('Bone', 1, 0, 0, '{}', 'Carved from large creatures, surprisingly durable.', 0.6),
  
  -- Tier 2: Uncommon  
  ('Silver', 2, 0, 0, '{"silvered": true}', 'Effective against lycanthropes and some undead.', 2.0),
  ('Cold Iron', 2, 0, 0, '{"cold_iron": true}', 'Anathema to fey creatures.', 2.5),
  ('Darkwood', 2, 0, 0, '{"lightweight": true}', 'Exceptionally light yet strong wood from ancient forests.', 3.0),
  
  -- Tier 3: Rare
  ('Mithril', 3, 0, 1, '{"lightweight": true, "no_disadvantage_stealth": true}', 'Elven silver-steel, lighter than steel yet stronger.', 10.0),
  ('Adamantine', 3, 1, 0, '{"bypasses_hardness": true, "critical_immunity": true}', 'Nearly indestructible metal from deep earth.', 15.0),
  
  -- Tier 4: Very Rare
  ('Orichalcum', 4, 1, 1, '{"magic_conductor": true}', 'Ancient alloy that resonates with magical energy.', 25.0),
  ('Starmetal', 4, 2, 0, '{"radiant_damage": true}', 'Metal from fallen stars, burns with inner light.', 30.0),
  
  -- Tier 5: Legendary
  ('Dragonbone', 5, 2, 1, '{"elemental_affinity": true}', 'Bones of ancient dragons, imbued with elemental power.', 50.0),
  ('Celestial Steel', 5, 2, 2, '{"holy": true, "radiant_damage": true}', 'Forged in the Upper Planes, anathema to fiends.', 100.0)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- WEAPON TEMPLATES REFERENCE TABLE
-- ============================================================================
-- Standard weapon definitions from D&D 5e + custom weapons.
-- Characters own INSTANCES that reference these templates.

CREATE TABLE IF NOT EXISTS weapon_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category weapon_category NOT NULL,
  
  -- Damage
  damage_dice TEXT NOT NULL, -- '1d8', '2d6', etc.
  damage_type damage_type NOT NULL,
  versatile_dice TEXT, -- If versatile, the two-handed damage
  
  -- Properties (stored as array for easy querying)
  properties TEXT[] DEFAULT '{}',
  -- Options: 'light', 'finesse', 'heavy', 'reach', 'thrown', 'two-handed', 
  --          'versatile', 'ammunition', 'loading', 'special'
  
  -- Range (for ranged/thrown weapons)
  range_normal INT, -- Normal range in feet
  range_long INT,   -- Long range in feet
  
  -- Physical
  weight_lb DECIMAL(5,2),
  base_cost_gp INT,
  
  -- Flavor
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE weapon_templates IS 'Reference table for standard weapon types';

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_weapon_templates_category ON weapon_templates(category);

-- Seed standard D&D 5e weapons
INSERT INTO weapon_templates (name, category, damage_dice, damage_type, versatile_dice, properties, range_normal, range_long, weight_lb, base_cost_gp, description) VALUES
  -- Simple Melee
  ('Club', 'simple_melee', '1d4', 'bludgeoning', NULL, ARRAY['light'], NULL, NULL, 2, 1, 'A simple wooden club.'),
  ('Dagger', 'simple_melee', '1d4', 'piercing', NULL, ARRAY['finesse', 'light', 'thrown'], 20, 60, 1, 2, 'A small blade for close quarters or throwing.'),
  ('Greatclub', 'simple_melee', '1d8', 'bludgeoning', NULL, ARRAY['two-handed'], NULL, NULL, 10, 2, 'A massive club requiring two hands.'),
  ('Handaxe', 'simple_melee', '1d6', 'slashing', NULL, ARRAY['light', 'thrown'], 20, 60, 2, 5, 'A small axe balanced for throwing.'),
  ('Javelin', 'simple_melee', '1d6', 'piercing', NULL, ARRAY['thrown'], 30, 120, 2, 5, 'A light spear designed for throwing.'),
  ('Light Hammer', 'simple_melee', '1d4', 'bludgeoning', NULL, ARRAY['light', 'thrown'], 20, 60, 2, 2, 'A small hammer that can be thrown.'),
  ('Mace', 'simple_melee', '1d6', 'bludgeoning', NULL, ARRAY[]::TEXT[], NULL, NULL, 4, 5, 'A weighted metal head on a handle.'),
  ('Quarterstaff', 'simple_melee', '1d6', 'bludgeoning', '1d8', ARRAY['versatile'], NULL, NULL, 4, 2, 'A simple wooden staff, versatile in combat.'),
  ('Sickle', 'simple_melee', '1d4', 'slashing', NULL, ARRAY['light'], NULL, NULL, 2, 1, 'A curved blade used for harvesting.'),
  ('Spear', 'simple_melee', '1d6', 'piercing', '1d8', ARRAY['thrown', 'versatile'], 20, 60, 3, 1, 'A pole with a pointed tip.'),
  
  -- Simple Ranged
  ('Light Crossbow', 'simple_ranged', '1d8', 'piercing', NULL, ARRAY['ammunition', 'loading', 'two-handed'], 80, 320, 5, 25, 'A mechanical bow that fires bolts.'),
  ('Dart', 'simple_ranged', '1d4', 'piercing', NULL, ARRAY['finesse', 'thrown'], 20, 60, 0.25, 0, 'A small throwing weapon.'),
  ('Shortbow', 'simple_ranged', '1d6', 'piercing', NULL, ARRAY['ammunition', 'two-handed'], 80, 320, 2, 25, 'A small bow for quick shots.'),
  ('Sling', 'simple_ranged', '1d4', 'bludgeoning', NULL, ARRAY['ammunition'], 30, 120, 0, 1, 'A leather strap that hurls stones.'),
  
  -- Martial Melee
  ('Battleaxe', 'martial_melee', '1d8', 'slashing', '1d10', ARRAY['versatile'], NULL, NULL, 4, 10, 'A heavy axe for battle.'),
  ('Flail', 'martial_melee', '1d8', 'bludgeoning', NULL, ARRAY[]::TEXT[], NULL, NULL, 2, 10, 'A spiked ball on a chain.'),
  ('Glaive', 'martial_melee', '1d10', 'slashing', NULL, ARRAY['heavy', 'reach', 'two-handed'], NULL, NULL, 6, 20, 'A blade on a long pole.'),
  ('Greataxe', 'martial_melee', '1d12', 'slashing', NULL, ARRAY['heavy', 'two-handed'], NULL, NULL, 7, 30, 'A massive two-handed axe.'),
  ('Greatsword', 'martial_melee', '2d6', 'slashing', NULL, ARRAY['heavy', 'two-handed'], NULL, NULL, 6, 50, 'A large two-handed sword.'),
  ('Halberd', 'martial_melee', '1d10', 'slashing', NULL, ARRAY['heavy', 'reach', 'two-handed'], NULL, NULL, 6, 20, 'An axe blade topped with a spike.'),
  ('Lance', 'martial_melee', '1d12', 'piercing', NULL, ARRAY['reach', 'special'], NULL, NULL, 6, 10, 'A long weapon for mounted combat.'),
  ('Longsword', 'martial_melee', '1d8', 'slashing', '1d10', ARRAY['versatile'], NULL, NULL, 3, 15, 'A classic one-handed sword.'),
  ('Maul', 'martial_melee', '2d6', 'bludgeoning', NULL, ARRAY['heavy', 'two-handed'], NULL, NULL, 10, 10, 'A massive two-handed hammer.'),
  ('Morningstar', 'martial_melee', '1d8', 'piercing', NULL, ARRAY[]::TEXT[], NULL, NULL, 4, 15, 'A spiked mace.'),
  ('Pike', 'martial_melee', '1d10', 'piercing', NULL, ARRAY['heavy', 'reach', 'two-handed'], NULL, NULL, 18, 5, 'A very long spear.'),
  ('Rapier', 'martial_melee', '1d8', 'piercing', NULL, ARRAY['finesse'], NULL, NULL, 2, 25, 'A thin, elegant thrusting sword.'),
  ('Scimitar', 'martial_melee', '1d6', 'slashing', NULL, ARRAY['finesse', 'light'], NULL, NULL, 3, 25, 'A curved slashing sword.'),
  ('Shortsword', 'martial_melee', '1d6', 'piercing', NULL, ARRAY['finesse', 'light'], NULL, NULL, 2, 10, 'A short blade for quick strikes.'),
  ('Trident', 'martial_melee', '1d6', 'piercing', '1d8', ARRAY['thrown', 'versatile'], 20, 60, 4, 5, 'A three-pronged spear.'),
  ('War Pick', 'martial_melee', '1d8', 'piercing', NULL, ARRAY[]::TEXT[], NULL, NULL, 2, 5, 'A pick designed for armor penetration.'),
  ('Warhammer', 'martial_melee', '1d8', 'bludgeoning', '1d10', ARRAY['versatile'], NULL, NULL, 2, 15, 'A hammer built for war.'),
  ('Whip', 'martial_melee', '1d4', 'slashing', NULL, ARRAY['finesse', 'reach'], NULL, NULL, 3, 2, 'A leather whip with reach.'),
  
  -- Martial Ranged
  ('Blowgun', 'martial_ranged', '1', 'piercing', NULL, ARRAY['ammunition', 'loading'], 25, 100, 1, 10, 'A tube that fires needles.'),
  ('Hand Crossbow', 'martial_ranged', '1d6', 'piercing', NULL, ARRAY['ammunition', 'light', 'loading'], 30, 120, 3, 75, 'A small, one-handed crossbow.'),
  ('Heavy Crossbow', 'martial_ranged', '1d10', 'piercing', NULL, ARRAY['ammunition', 'heavy', 'loading', 'two-handed'], 100, 400, 18, 50, 'A powerful mechanical bow.'),
  ('Longbow', 'martial_ranged', '1d8', 'piercing', NULL, ARRAY['ammunition', 'heavy', 'two-handed'], 150, 600, 2, 50, 'A tall bow with excellent range.')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ITEM TEMPLATES REFERENCE TABLE
-- ============================================================================
-- Standard item definitions for potions, gear, etc.

CREATE TABLE IF NOT EXISTS item_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'potion', 'scroll', 'gear', 'ammo', 'food', 'tool', 'container'
  
  -- For consumables
  uses INT, -- NULL = unlimited, 1 = single use, etc.
  
  -- For ammo
  ammo_type TEXT, -- 'arrow', 'bolt', 'bullet', 'needle', 'stone'
  
  -- Value
  base_cost_gp DECIMAL(10,2),
  weight_lb DECIMAL(5,2),
  
  -- Effects (flexible JSON)
  effects JSONB DEFAULT '{}',
  -- Example: {"healing": "2d4+2", "duration_hours": 1}
  
  -- Flavor
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE item_templates IS 'Reference table for standard item types';

CREATE INDEX IF NOT EXISTS idx_item_templates_category ON item_templates(category);

-- Seed common items
INSERT INTO item_templates (name, category, uses, ammo_type, base_cost_gp, weight_lb, effects, description) VALUES
  -- Potions
  ('Potion of Healing', 'potion', 1, NULL, 50, 0.5, '{"healing": "2d4+2"}', 'Restores 2d4+2 hit points.'),
  ('Potion of Greater Healing', 'potion', 1, NULL, 150, 0.5, '{"healing": "4d4+4"}', 'Restores 4d4+4 hit points.'),
  ('Potion of Superior Healing', 'potion', 1, NULL, 500, 0.5, '{"healing": "8d4+8"}', 'Restores 8d4+8 hit points.'),
  ('Antitoxin', 'potion', 1, NULL, 50, 0.5, '{"advantage_vs": "poison", "duration_hours": 1}', 'Advantage on saves vs poison for 1 hour.'),
  
  -- Ammunition
  ('Arrow', 'ammo', NULL, 'arrow', 0.05, 0.05, '{}', 'Standard arrow for bows.'),
  ('Arrow, Silver', 'ammo', NULL, 'arrow', 5, 0.05, '{"silvered": true}', 'Arrow with a silver tip.'),
  ('Bolt', 'ammo', NULL, 'bolt', 0.05, 0.075, '{}', 'Standard crossbow bolt.'),
  ('Bullet, Sling', 'ammo', NULL, 'stone', 0.002, 0.075, '{}', 'Sling ammunition.'),
  ('Needle, Blowgun', 'ammo', NULL, 'needle', 0.02, 0.02, '{}', 'Blowgun needle.'),
  
  -- Gear
  ('Rope, Hempen (50 ft)', 'gear', NULL, NULL, 1, 10, '{}', '50 feet of hemp rope.'),
  ('Rope, Silk (50 ft)', 'gear', NULL, NULL, 10, 5, '{}', '50 feet of silk rope.'),
  ('Torch', 'gear', 1, NULL, 0.01, 1, '{"light_bright": 20, "light_dim": 40, "duration_hours": 1}', 'Provides light for 1 hour.'),
  ('Lantern, Hooded', 'gear', NULL, NULL, 5, 2, '{"light_bright": 30, "light_dim": 60}', 'Adjustable lantern.'),
  ('Caltrops (bag of 20)', 'gear', 1, NULL, 1, 2, '{"area_denial": true}', 'Covers a 5-foot square.'),
  ('Ball Bearings (bag of 1000)', 'gear', 1, NULL, 1, 2, '{"area_denial": true}', 'Covers a 10-foot square.'),
  ('Healer''s Kit', 'gear', 10, NULL, 5, 3, '{"stabilize": true}', '10 uses, stabilizes dying creatures.'),
  ('Thieves'' Tools', 'tool', NULL, NULL, 25, 1, '{}', 'Required for picking locks and disarming traps.'),
  ('Climbing Kit', 'tool', NULL, NULL, 25, 12, '{}', 'Pitons, boot tips, gloves, and harness.'),
  
  -- Food
  ('Rations (1 day)', 'food', 1, NULL, 0.5, 2, '{"sustenance": 1}', 'One day of trail food.'),
  ('Waterskin', 'container', NULL, NULL, 0.2, 5, '{"capacity_pints": 4}', 'Holds 4 pints of liquid.')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- UPDATE CHARACTER_WEAPONS TO REFERENCE TEMPLATES
-- ============================================================================

-- Add foreign key columns
ALTER TABLE character_weapons
  ADD COLUMN IF NOT EXISTS template_id INT REFERENCES weapon_templates(id),
  ADD COLUMN IF NOT EXISTS material_id INT REFERENCES materials(id);

-- Add index for joins
CREATE INDEX IF NOT EXISTS idx_character_weapons_template ON character_weapons(template_id);
CREATE INDEX IF NOT EXISTS idx_character_weapons_material ON character_weapons(material_id);

-- Set default material to Steel for existing weapons
UPDATE character_weapons 
SET material_id = (SELECT id FROM materials WHERE name = 'Steel')
WHERE material_id IS NULL;

-- ============================================================================
-- UPDATE CHARACTER_ITEMS TO REFERENCE TEMPLATES
-- ============================================================================

ALTER TABLE character_items
  ADD COLUMN IF NOT EXISTS template_id INT REFERENCES item_templates(id);

CREATE INDEX IF NOT EXISTS idx_character_items_template ON character_items(template_id);

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View that joins weapons with their templates and materials
CREATE OR REPLACE VIEW character_weapons_full AS
SELECT 
  cw.*,
  wt.name as template_name,
  wt.category as weapon_category,
  wt.damage_dice as base_damage_dice,
  wt.damage_type as base_damage_type,
  wt.versatile_dice,
  wt.properties as weapon_properties,
  wt.range_normal,
  wt.range_long,
  wt.description as template_description,
  m.name as material_name,
  m.tier as material_tier,
  m.damage_bonus as material_damage_bonus,
  m.attack_bonus as material_attack_bonus,
  m.properties as material_properties,
  m.description as material_description
FROM character_weapons cw
LEFT JOIN weapon_templates wt ON cw.template_id = wt.id
LEFT JOIN materials m ON cw.material_id = m.id;

-- View that joins items with their templates
CREATE OR REPLACE VIEW character_items_full AS
SELECT 
  ci.*,
  it.name as template_name,
  it.uses as template_uses,
  it.ammo_type as template_ammo_type,
  it.effects as template_effects,
  it.description as template_description
FROM character_items ci
LEFT JOIN item_templates it ON ci.template_id = it.id;


