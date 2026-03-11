-- 011_weapon_self_contained.sql
-- Make character_weapons fully self-contained by copying all template data.
-- Part of "templates as creation shortcuts" architecture change.

-- Add missing columns to character_weapons
ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS range_normal INT;
ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS range_long INT;
ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS versatile_dice TEXT;

-- Backfill: copy template data into existing template-based weapons.
-- properties: TEXT[] on weapon_templates → JSONB on character_weapons (to_jsonb handles conversion)
-- range + versatile_dice: direct copy
UPDATE character_weapons cw
SET
  properties = COALESCE(cw.properties, to_jsonb(wt.properties)),
  range_normal = COALESCE(cw.range_normal, wt.range_normal),
  range_long = COALESCE(cw.range_long, wt.range_long),
  versatile_dice = COALESCE(cw.versatile_dice, wt.versatile_dice)
FROM weapon_templates wt
WHERE cw.template_id = wt.id
  AND cw.template_id IS NOT NULL;
