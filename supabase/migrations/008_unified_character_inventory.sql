-- ============================================================================
-- UNIFIED CHARACTER INVENTORY SYSTEM
-- ============================================================================
-- This migration consolidates all inventory to be character-based.
-- 
-- BEFORE (Messy):
--   user_inventory, user_brewed, user_recipes → tied to profiles.id
--   character_weapons, character_items → tied to characters.id, duplicates data
--   character_quick_slots → messy cross-reference to user_brewed
--
-- AFTER (Clean):
--   All inventory tied to characters.id
--   Ownership tables just reference templates (like herbs pattern)
--   No data duplication
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE NEW CHARACTER-BASED HERBALISM TABLES
-- ============================================================================

-- Character's herb inventory (replaces user_inventory)
CREATE TABLE IF NOT EXISTS character_herbs (
  id SERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  herb_id INT NOT NULL REFERENCES herbs(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each character can only have one row per herb type
  UNIQUE(character_id, herb_id)
);

CREATE INDEX IF NOT EXISTS idx_character_herbs_character ON character_herbs(character_id);
CREATE INDEX IF NOT EXISTS idx_character_herbs_herb ON character_herbs(herb_id);

COMMENT ON TABLE character_herbs IS 'Herbs owned by a character. References herbs table, no data duplication.';

-- Character's brewed items (replaces user_brewed)
-- Note: Brewed items are CREATED things with specific choices, not just recipe references
CREATE TABLE IF NOT EXISTS character_brewed (
  id SERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('elixir', 'bomb', 'oil')),
  effects JSONB NOT NULL DEFAULT '[]', -- Array of effect names chosen during brewing
  choices JSONB DEFAULT '{}', -- Decisions made during brewing (e.g., damage type selection)
  computed_description TEXT, -- Generated description based on effects
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_brewed_character ON character_brewed(character_id);
CREATE INDEX IF NOT EXISTS idx_character_brewed_type ON character_brewed(type);

COMMENT ON TABLE character_brewed IS 'Brewed items (elixirs, bombs, oils) created by a character.';

-- Character's known recipes (replaces user_recipes)
CREATE TABLE IF NOT EXISTS character_recipes (
  id SERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each character can only know a recipe once
  UNIQUE(character_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_character_recipes_character ON character_recipes(character_id);

COMMENT ON TABLE character_recipes IS 'Recipes known by a character. References recipes table.';

-- ============================================================================
-- STEP 2: CLEAN UP CHARACTER_WEAPONS
-- Remove duplicated columns, keep only references + customizations
-- ============================================================================

-- First, ensure template_id and material_id are properly set for existing data
-- Set template_id based on matching name if not already set
UPDATE character_weapons cw
SET template_id = wt.id
FROM weapon_templates wt
WHERE cw.template_id IS NULL 
  AND LOWER(cw.name) = LOWER(wt.name);

-- Set default material (Steel) for weapons without material_id
UPDATE character_weapons
SET material_id = (SELECT id FROM materials WHERE name = 'Steel' LIMIT 1)
WHERE material_id IS NULL;

-- Now we can make these columns required for NEW inserts
-- But we won't drop the old columns yet to avoid breaking existing code
-- Instead, we'll add constraints and let TypeScript handle the rest

-- Add NOT NULL constraint to template_id (with default for safety)
-- Note: We can't easily make existing nullable columns NOT NULL without handling existing NULLs
-- So we'll document that template_id SHOULD be required and enforce in TypeScript

-- ============================================================================
-- STEP 3: CLEAN UP CHARACTER_ITEMS
-- Same pattern as weapons
-- ============================================================================

-- Set template_id based on matching name if not already set
UPDATE character_items ci
SET template_id = it.id
FROM item_templates it
WHERE ci.template_id IS NULL 
  AND LOWER(ci.name) = LOWER(it.name);

-- ============================================================================
-- STEP 4: UPDATE CHARACTER_QUICK_SLOTS
-- Fix the reference to use character_brewed instead of user_brewed
-- ============================================================================

-- Add new column for character_brewed reference
ALTER TABLE character_quick_slots
ADD COLUMN IF NOT EXISTS character_brewed_id INT REFERENCES character_brewed(id) ON DELETE SET NULL;

-- Update the check constraint to use the new column
-- First drop the old constraint if it exists
ALTER TABLE character_quick_slots
DROP CONSTRAINT IF EXISTS check_item_or_brewed_item;

-- Add new constraint
ALTER TABLE character_quick_slots
ADD CONSTRAINT check_quick_slot_item
CHECK (
  -- At most one type of item can be assigned
  (item_id IS NOT NULL AND brewed_item_id IS NULL AND character_brewed_id IS NULL) OR
  (item_id IS NULL AND brewed_item_id IS NOT NULL AND character_brewed_id IS NULL) OR
  (item_id IS NULL AND brewed_item_id IS NULL AND character_brewed_id IS NOT NULL) OR
  (item_id IS NULL AND brewed_item_id IS NULL AND character_brewed_id IS NULL)
);

-- ============================================================================
-- STEP 5: MIGRATE DATA FROM LEGACY TABLES
-- ============================================================================

-- Migrate herbs from user_inventory to character_herbs
INSERT INTO character_herbs (character_id, herb_id, quantity)
SELECT DISTINCT ON (c.id, ui.herb_id)
  c.id as character_id,
  ui.herb_id,
  ui.quantity
FROM user_inventory ui
JOIN characters c ON c.user_id = ui.user_id
ON CONFLICT (character_id, herb_id) DO UPDATE SET
  quantity = character_herbs.quantity + EXCLUDED.quantity;

-- Migrate brewed items from user_brewed to character_brewed
-- Note: effects in user_brewed may be TEXT, cast to JSONB
INSERT INTO character_brewed (character_id, type, effects, choices, computed_description, quantity)
SELECT 
  c.id as character_id,
  ub.type,
  CASE 
    WHEN ub.effects IS NULL THEN '[]'::jsonb
    WHEN ub.effects::text LIKE '[%' THEN ub.effects::jsonb
    ELSE jsonb_build_array(ub.effects::text)
  END,
  COALESCE(ub.choices::jsonb, '{}'::jsonb),
  ub.computed_description,
  ub.quantity
FROM user_brewed ub
JOIN characters c ON c.user_id = ub.user_id;

-- Migrate recipes from user_recipes to character_recipes
INSERT INTO character_recipes (character_id, recipe_id)
SELECT DISTINCT ON (c.id, ur.recipe_id)
  c.id as character_id,
  ur.recipe_id
FROM user_recipes ur
JOIN characters c ON c.user_id = ur.user_id
ON CONFLICT (character_id, recipe_id) DO NOTHING;

-- Update character_quick_slots to use new character_brewed_id
-- Need to set both columns atomically to satisfy the check constraint
-- Match by type and computed_description (more reliable than effects comparison)
UPDATE character_quick_slots cqs
SET 
  character_brewed_id = cb.id,
  brewed_item_id = NULL  -- Clear old reference
FROM user_brewed ub
JOIN characters c ON c.user_id = ub.user_id
JOIN character_brewed cb ON cb.character_id = c.id 
  AND cb.type = ub.type
  AND cb.computed_description = ub.computed_description
WHERE cqs.brewed_item_id = ub.id
  AND cqs.character_id = c.id;

-- ============================================================================
-- STEP 6: DROP UNUSED VIEWS
-- These were unnecessary complexity
-- ============================================================================

DROP VIEW IF EXISTS character_weapons_full;
DROP VIEW IF EXISTS character_items_full;

-- ============================================================================
-- STEP 7: RLS POLICIES FOR NEW TABLES
-- ============================================================================

ALTER TABLE character_herbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_brewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_recipes ENABLE ROW LEVEL SECURITY;

-- character_herbs policies
CREATE POLICY "Users can view own character herbs"
  ON character_herbs FOR SELECT
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own character herbs"
  ON character_herbs FOR INSERT
  TO authenticated
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own character herbs"
  ON character_herbs FOR UPDATE
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own character herbs"
  ON character_herbs FOR DELETE
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- character_brewed policies
CREATE POLICY "Users can view own character brewed"
  ON character_brewed FOR SELECT
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own character brewed"
  ON character_brewed FOR INSERT
  TO authenticated
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own character brewed"
  ON character_brewed FOR UPDATE
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own character brewed"
  ON character_brewed FOR DELETE
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- character_recipes policies
CREATE POLICY "Users can view own character recipes"
  ON character_recipes FOR SELECT
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own character recipes"
  ON character_recipes FOR INSERT
  TO authenticated
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own character recipes"
  ON character_recipes FOR DELETE
  TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- ============================================================================
-- STEP 8: TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_character_herbs_updated_at
  BEFORE UPDATE ON character_herbs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_brewed_updated_at
  BEFORE UPDATE ON character_brewed
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON COLUMN character_weapons.template_id IS 'REQUIRED: Reference to weapon_templates. All weapon properties come from here.';
COMMENT ON COLUMN character_weapons.material_id IS 'REQUIRED: Reference to materials. Material bonuses come from here.';
COMMENT ON COLUMN character_weapons.name IS 'DEPRECATED: Use custom_name for overrides, template provides base name.';
COMMENT ON COLUMN character_weapons.damage_dice IS 'DEPRECATED: Comes from template.';
COMMENT ON COLUMN character_weapons.damage_type IS 'DEPRECATED: Comes from template.';
COMMENT ON COLUMN character_weapons.weapon_type IS 'DEPRECATED: Comes from template.';

COMMENT ON COLUMN character_items.template_id IS 'REQUIRED: Reference to item_templates. All item properties come from here.';
COMMENT ON COLUMN character_items.name IS 'DEPRECATED: Use custom_name for overrides, template provides base name.';
COMMENT ON COLUMN character_items.category IS 'DEPRECATED: Comes from template.';

COMMENT ON COLUMN character_quick_slots.brewed_item_id IS 'DEPRECATED: Use character_brewed_id instead.';

-- ============================================================================
-- NOTE: We're NOT dropping the legacy tables yet (user_inventory, user_brewed, user_recipes)
-- This allows rollback if needed. They can be dropped in a future migration
-- after confirming the new system works correctly.
-- ============================================================================

