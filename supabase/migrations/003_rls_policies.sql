-- ============================================================================
-- Knights of Belyar - Phase 1: Row Level Security Policies
-- ============================================================================
-- Sets up RLS for all new tables.
-- Reference tables (skills, armor_slots) are publicly readable.
-- Character tables are restricted to the owning user.
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE armor_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_armor ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REFERENCE TABLES: Public read access
-- ============================================================================
-- These contain static game data that all users need to read.

-- Skills: Anyone can read
CREATE POLICY "Skills are publicly readable"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

-- Armor slots: Anyone can read
CREATE POLICY "Armor slots are publicly readable"
  ON armor_slots FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- CHARACTERS: Owner-only access
-- ============================================================================

-- Select: Users can only see their own character
CREATE POLICY "Users can view own character"
  ON characters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert: Users can only create a character for themselves
CREATE POLICY "Users can create own character"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update: Users can only update their own character
CREATE POLICY "Users can update own character"
  ON characters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can only delete their own character
CREATE POLICY "Users can delete own character"
  ON characters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHARACTER_SKILLS: Owner-only access (via character)
-- ============================================================================

CREATE POLICY "Users can view own character skills"
  ON character_skills FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own character skills"
  ON character_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own character skills"
  ON character_skills FOR UPDATE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own character skills"
  ON character_skills FOR DELETE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CHARACTER_ARMOR: Owner-only access (via character)
-- ============================================================================

CREATE POLICY "Users can view own character armor"
  ON character_armor FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own character armor"
  ON character_armor FOR INSERT
  TO authenticated
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own character armor"
  ON character_armor FOR UPDATE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own character armor"
  ON character_armor FOR DELETE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CHARACTER_WEAPONS: Owner-only access (via character)
-- ============================================================================

CREATE POLICY "Users can view own character weapons"
  ON character_weapons FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own character weapons"
  ON character_weapons FOR INSERT
  TO authenticated
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own character weapons"
  ON character_weapons FOR UPDATE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own character weapons"
  ON character_weapons FOR DELETE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CHARACTER_ITEMS: Owner-only access (via character)
-- ============================================================================

CREATE POLICY "Users can view own character items"
  ON character_items FOR SELECT
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own character items"
  ON character_items FOR INSERT
  TO authenticated
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own character items"
  ON character_items FOR UPDATE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own character items"
  ON character_items FOR DELETE
  TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. All policies require authentication (TO authenticated)
-- 2. Reference tables (skills, armor_slots) are read-only for users
-- 3. Character-related tables check ownership via the characters table
-- 4. The existing herbalism tables (user_inventory, etc.) will get updated
--    RLS policies in Phase 7 when we migrate to character_id
--
-- To verify policies are working:
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';

