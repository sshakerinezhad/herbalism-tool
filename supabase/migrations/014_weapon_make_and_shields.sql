-- 014_weapon_make_and_shields.sql
-- Wave 2C Piece 2: weapon make-tier (forge quality) + shield attributes.
-- These are stored and DISPLAYED (computed attack/damage modifiers); no live
-- durability/deterioration tracking yet — that lands in Wave 3B.

-- Make-tier: forge quality affecting attack/damage (default = normal use).
ALTER TABLE character_weapons
  ADD COLUMN IF NOT EXISTS make_tier TEXT NOT NULL DEFAULT 'standard_forged';

-- Shield attributes. Shields are weapons that also grant AC when marked active.
ALTER TABLE character_weapons
  ADD COLUMN IF NOT EXISTS is_shield BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE character_weapons
  ADD COLUMN IF NOT EXISTS ac_bonus INT;          -- AC granted when this shield is active
ALTER TABLE character_weapons
  ADD COLUMN IF NOT EXISTS str_requirement INT;   -- STR score needed to use without penalty
ALTER TABLE character_weapons
  ADD COLUMN IF NOT EXISTS shield_active BOOLEAN NOT NULL DEFAULT false;

-- Guard make_tier to the six EPG forge qualities.
ALTER TABLE character_weapons
  DROP CONSTRAINT IF EXISTS character_weapons_make_tier_check;
ALTER TABLE character_weapons
  ADD CONSTRAINT character_weapons_make_tier_check
  CHECK (make_tier IN (
    'master_forged', 'artisan_forged', 'standard_forged', 'dusted', 'busted', 'broke'
  ));
