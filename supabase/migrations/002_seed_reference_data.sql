-- ============================================================================
-- Knights of Belyar - Phase 1: Seed Reference Data
-- ============================================================================
-- Populates static reference tables with game data.
-- Run this AFTER 001_characters_foundation.sql
-- ============================================================================

-- ============================================================================
-- SKILLS (27 total)
-- ============================================================================

INSERT INTO skills (name, stat, display_order) VALUES
  -- STR (1 skill)
  ('Athletics', 'str', 1),
  
  -- DEX (4 skills)
  ('Acrobatics', 'dex', 2),
  ('Initiative', 'dex', 3),
  ('Sleight of Hand', 'dex', 4),
  ('Stealth', 'dex', 5),
  
  -- CON (2 skills)
  ('Fortitude', 'con', 6),
  ('Recovery', 'con', 7),
  
  -- INT (5 skills)
  ('Arcana', 'int', 8),
  ('Geography', 'int', 9),
  ('History', 'int', 10),
  ('Nature', 'int', 11),
  ('Religion', 'int', 12),
  
  -- WIS (5 skills)
  ('Animal Handling', 'wis', 13),
  ('Healing', 'wis', 14),
  ('Insight', 'wis', 15),
  ('Perception', 'wis', 16),
  ('Survival', 'wis', 17),
  
  -- CHA (4 skills)
  ('Deception', 'cha', 18),
  ('Intimidation', 'cha', 19),
  ('Persuasion', 'cha', 20),
  ('Performance', 'cha', 21),
  
  -- HON (5 skills)
  ('Chivalry', 'hon', 22),
  ('Favor', 'hon', 23),
  ('Courtesy', 'hon', 24),
  ('Notions', 'hon', 25),
  ('Poetry', 'hon', 26)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ARMOR SLOTS (12 body locations)
-- ============================================================================
-- Based on the armor chart:
-- - Light: 6 pieces (Helm, Padded, L/R Bracer, L/R Greave)
-- - Medium: 6 pieces (Helm, Breastplate, L/R Bracer, L/R Greave)
-- - Heavy: 12 pieces (all slots)

INSERT INTO armor_slots (
  slot_key, display_name, slot_order,
  light_available, light_piece_name, light_bonus,
  medium_available, medium_piece_name, medium_bonus,
  heavy_available, heavy_piece_name, heavy_bonus
) VALUES
  -- 1. Head (all types)
  ('head', 'Head', 1,
   TRUE, 'Helm', 2,
   TRUE, 'Helm', 2,
   TRUE, 'Helm', 2),
  
  -- 2. Neck (heavy only)
  ('neck', 'Neck', 2,
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, 'Gorget', 2),
  
  -- 3. Chest (all types, different pieces)
  ('chest', 'Chest', 3,
   TRUE, 'Padded Armor', 1,
   TRUE, 'Breastplate', 2,
   TRUE, 'Breastplate', 2),
  
  -- 4. Left Shoulder (heavy only)
  ('left_shoulder', 'Left Shoulder', 4,
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, 'Left Pauldron', 2),
  
  -- 5. Right Shoulder (heavy only)
  ('right_shoulder', 'Right Shoulder', 5,
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, 'Right Pauldron', 2),
  
  -- 6. Left Hand (all types, different pieces)
  ('left_hand', 'Left Hand', 6,
   TRUE, 'Left Bracer', 1,
   TRUE, 'Left Bracer', 1,
   TRUE, 'Left Gauntlet', 2),
  
  -- 7. Right Hand (all types, different pieces)
  ('right_hand', 'Right Hand', 7,
   TRUE, 'Right Bracer', 1,
   TRUE, 'Right Bracer', 1,
   TRUE, 'Right Gauntlet', 2),
  
  -- 8. Groin (heavy only)
  ('groin', 'Groin', 8,
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, 'Tasset', 2),
  
  -- 9. Left Knee (heavy only)
  ('left_knee', 'Left Knee', 9,
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, 'Left Poleyn', 1),
  
  -- 10. Right Knee (heavy only)
  ('right_knee', 'Right Knee', 10,
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, 'Right Poleyn', 1),
  
  -- 11. Left Foot (all types)
  ('left_foot', 'Left Foot', 11,
   TRUE, 'Left Greave', 1,
   TRUE, 'Left Greave', 1,
   TRUE, 'Left Greave', 1),
  
  -- 12. Right Foot (all types)
  ('right_foot', 'Right Foot', 12,
   TRUE, 'Right Greave', 1,
   TRUE, 'Right Greave', 1,
   TRUE, 'Right Greave', 1)
ON CONFLICT (slot_key) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to test)
-- ============================================================================

-- Check skills count and breakdown
-- SELECT stat, COUNT(*) as count FROM skills GROUP BY stat ORDER BY MIN(display_order);

-- Check armor slots
-- SELECT slot_order, display_name, light_available, medium_available, heavy_available 
-- FROM armor_slots ORDER BY slot_order;

-- Calculate max AC per armor type
-- SELECT 
--   'Light' as type, SUM(light_bonus) as max_bonus, 6 + SUM(light_bonus) as base_ac
-- FROM armor_slots WHERE light_available
-- UNION ALL
-- SELECT 
--   'Medium' as type, SUM(medium_bonus) as max_bonus, 8 + SUM(medium_bonus) as base_ac
-- FROM armor_slots WHERE medium_available
-- UNION ALL
-- SELECT 
--   'Heavy' as type, SUM(heavy_bonus) as max_bonus, 0 + SUM(heavy_bonus) as base_ac
-- FROM armor_slots WHERE heavy_available;

