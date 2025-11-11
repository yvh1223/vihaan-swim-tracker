-- ============================================================================
-- Coach Feedback & Authentication System - Database Schema
-- ============================================================================
-- Date: 2025-01-14
-- Purpose: Add coach feedback capture and parent authentication
-- Database: Supabase PostgreSQL
--
-- IMPORTANT: Run this script using Supabase SQL Editor with SERVICE ROLE access
--
-- Tables Created:
--   1. user_profiles - Links Supabase Auth users to roles and swimmers
--   2. coach_feedback - Stores coach feedback for swimmers
--   3. feedback_acknowledgments - Tracks parent engagement
--   4. feedback_audit_log - Audit trail for changes
-- ============================================================================

-- ============================================================================
-- 1. USER PROFILES TABLE
-- ============================================================================
-- Links Supabase Auth users (auth.users) to application roles and swimmers
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'parent', 'swimmer')),
  full_name TEXT NOT NULL,
  linked_swimmer_ids INTEGER[] DEFAULT '{}',  -- Array of swimmer IDs for parents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'User accounts linked to Supabase Auth with roles and swimmer associations';
COMMENT ON COLUMN user_profiles.role IS 'User role: coach, parent, or swimmer';
COMMENT ON COLUMN user_profiles.linked_swimmer_ids IS 'Array of swimmer IDs that parents can access';

-- ============================================================================
-- 2. COACH FEEDBACK TABLE
-- ============================================================================
-- Stores feedback entries from coaches for each swimmer after meets
-- ============================================================================

CREATE TABLE IF NOT EXISTS coach_feedback (
  id BIGSERIAL PRIMARY KEY,
  swimmer_id INTEGER NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  meet_date DATE NOT NULL,
  meet_name TEXT,
  feedback_text TEXT NOT NULL,
  focus_areas JSONB DEFAULT '[]',      -- Array of specific practice focuses
  strengths JSONB DEFAULT '[]',        -- Things swimmer did well
  improvements JSONB DEFAULT '[]',     -- Areas needing improvement
  goals_for_next_meet TEXT,
  visibility TEXT DEFAULT 'parent-visible' CHECK (visibility IN ('private', 'parent-visible', 'public')),
  created_by_coach_id UUID REFERENCES user_profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  parent_acknowledged BOOLEAN DEFAULT FALSE,
  parent_acknowledged_at TIMESTAMPTZ,

  -- One feedback entry per swimmer per meet date
  CONSTRAINT feedback_per_swimmer_meet UNIQUE (swimmer_id, meet_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_feedback_swimmer ON coach_feedback(swimmer_id);
CREATE INDEX IF NOT EXISTS idx_coach_feedback_date ON coach_feedback(meet_date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_feedback_visibility ON coach_feedback(visibility);
CREATE INDEX IF NOT EXISTS idx_coach_feedback_coach ON coach_feedback(created_by_coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_feedback_acknowledged ON coach_feedback(parent_acknowledged);

-- Comments for documentation
COMMENT ON TABLE coach_feedback IS 'Coach feedback entries for swimmers after meets';
COMMENT ON COLUMN coach_feedback.focus_areas IS 'JSON array of practice focus areas (e.g., ["Flip turns", "Breathing"])';
COMMENT ON COLUMN coach_feedback.strengths IS 'JSON array of positive observations';
COMMENT ON COLUMN coach_feedback.improvements IS 'JSON array of areas to improve';
COMMENT ON COLUMN coach_feedback.visibility IS 'Controls who can see feedback: private (coach only), parent-visible, or public';

-- ============================================================================
-- 3. FEEDBACK ACKNOWLEDGMENTS TABLE
-- ============================================================================
-- Tracks when parents view and acknowledge feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_acknowledgments (
  id BIGSERIAL PRIMARY KEY,
  feedback_id BIGINT NOT NULL REFERENCES coach_feedback(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES user_profiles(user_id),
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,  -- Optional parent notes or questions

  CONSTRAINT unique_acknowledgment UNIQUE (feedback_id, parent_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_ack_feedback ON feedback_acknowledgments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_ack_parent ON feedback_acknowledgments(parent_user_id);

-- Comments for documentation
COMMENT ON TABLE feedback_acknowledgments IS 'Tracks parent engagement with feedback';
COMMENT ON COLUMN feedback_acknowledgments.notes IS 'Optional parent notes or questions about the feedback';

-- ============================================================================
-- 4. FEEDBACK AUDIT LOG TABLE
-- ============================================================================
-- Audit trail for all feedback changes (for security and compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_audit_log (
  id BIGSERIAL PRIMARY KEY,
  feedback_id BIGINT REFERENCES coach_feedback(id),
  action TEXT NOT NULL,  -- 'created', 'updated', 'deleted'
  changed_by UUID REFERENCES user_profiles(user_id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_feedback ON feedback_audit_log(feedback_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON feedback_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON feedback_audit_log(changed_by);

-- Comments for documentation
COMMENT ON TABLE feedback_audit_log IS 'Audit trail for all feedback changes';
COMMENT ON COLUMN feedback_audit_log.action IS 'Type of change: created, updated, or deleted';

-- ============================================================================
-- 5. AUTO-CREATE USER PROFILE TRIGGER
-- ============================================================================
-- Automatically creates user profile when new auth user signs up
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),  -- Default to parent
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Auto-creates user profile when new auth user signs up';

-- ============================================================================
-- 6. AUDIT LOG TRIGGER
-- ============================================================================
-- Automatically logs all changes to coach feedback
-- ============================================================================

CREATE OR REPLACE FUNCTION log_feedback_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO feedback_audit_log (feedback_id, action, changed_by, old_values, new_values)
    VALUES (NEW.id, 'updated', auth.uid(), row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO feedback_audit_log (feedback_id, action, changed_by, new_values)
    VALUES (NEW.id, 'created', auth.uid(), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO feedback_audit_log (feedback_id, action, changed_by, old_values)
    VALUES (OLD.id, 'deleted', auth.uid(), row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS audit_feedback_changes ON coach_feedback;

-- Create trigger
CREATE TRIGGER audit_feedback_changes
  AFTER INSERT OR UPDATE OR DELETE ON coach_feedback
  FOR EACH ROW EXECUTE FUNCTION log_feedback_changes();

COMMENT ON FUNCTION log_feedback_changes IS 'Logs all changes to coach_feedback table for audit trail';

-- ============================================================================
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Database-level privacy enforcement - CRITICAL SECURITY LAYER
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can view all profiles (for linking parents to swimmers)
DROP POLICY IF EXISTS "Coaches can view all profiles" ON user_profiles;
CREATE POLICY "Coaches can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COACH FEEDBACK POLICIES
-- ============================================================================

-- Coaches can view all feedback
DROP POLICY IF EXISTS "Coaches can view all feedback" ON coach_feedback;
CREATE POLICY "Coaches can view all feedback"
  ON coach_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

-- Coaches can insert feedback
DROP POLICY IF EXISTS "Coaches can insert feedback" ON coach_feedback;
CREATE POLICY "Coaches can insert feedback"
  ON coach_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

-- Coaches can update their own feedback
DROP POLICY IF EXISTS "Coaches can update own feedback" ON coach_feedback;
CREATE POLICY "Coaches can update own feedback"
  ON coach_feedback FOR UPDATE
  USING (created_by_coach_id = auth.uid())
  WITH CHECK (created_by_coach_id = auth.uid());

-- Coaches can delete their own feedback
DROP POLICY IF EXISTS "Coaches can delete own feedback" ON coach_feedback;
CREATE POLICY "Coaches can delete own feedback"
  ON coach_feedback FOR DELETE
  USING (created_by_coach_id = auth.uid());

-- Parents can view feedback for their linked swimmers (parent-visible or public only)
DROP POLICY IF EXISTS "Parents view feedback for linked swimmers" ON coach_feedback;
CREATE POLICY "Parents view feedback for linked swimmers"
  ON coach_feedback FOR SELECT
  USING (
    visibility IN ('parent-visible', 'public')
    AND swimmer_id = ANY (
      SELECT unnest(linked_swimmer_ids)
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Public users can view public feedback
DROP POLICY IF EXISTS "Public can view public feedback" ON coach_feedback;
CREATE POLICY "Public can view public feedback"
  ON coach_feedback FOR SELECT
  USING (visibility = 'public');

-- ============================================================================
-- FEEDBACK ACKNOWLEDGMENTS POLICIES
-- ============================================================================

-- Parents can insert acknowledgments for their linked swimmers
DROP POLICY IF EXISTS "Parents can acknowledge feedback" ON feedback_acknowledgments;
CREATE POLICY "Parents can acknowledge feedback"
  ON feedback_acknowledgments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_feedback cf
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE cf.id = feedback_id
        AND cf.swimmer_id = ANY(up.linked_swimmer_ids)
    )
  );

-- Parents can view their own acknowledgments
DROP POLICY IF EXISTS "Parents view own acknowledgments" ON feedback_acknowledgments;
CREATE POLICY "Parents view own acknowledgments"
  ON feedback_acknowledgments FOR SELECT
  USING (parent_user_id = auth.uid());

-- Coaches can view all acknowledgments
DROP POLICY IF EXISTS "Coaches view all acknowledgments" ON feedback_acknowledgments;
CREATE POLICY "Coaches view all acknowledgments"
  ON feedback_acknowledgments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Only coaches can view audit log
DROP POLICY IF EXISTS "Coaches can view audit log" ON feedback_audit_log;
CREATE POLICY "Coaches can view audit log"
  ON feedback_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get parent's linked swimmers
CREATE OR REPLACE FUNCTION get_parent_swimmers(parent_user_id UUID)
RETURNS TABLE (
  swimmer_id INTEGER,
  swimmer_name TEXT,
  current_age INTEGER,
  gender TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.full_name,
    s.current_age,
    s.gender
  FROM swimmers s
  WHERE s.id = ANY (
    SELECT unnest(linked_swimmer_ids)
    FROM user_profiles
    WHERE user_id = parent_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_parent_swimmers IS 'Returns all swimmers linked to a parent user';

-- Function to get unacknowledged feedback count
CREATE OR REPLACE FUNCTION get_unacknowledged_feedback_count(parent_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM coach_feedback cf
  WHERE cf.swimmer_id = ANY (
    SELECT unnest(linked_swimmer_ids)
    FROM user_profiles
    WHERE user_id = parent_user_id
  )
  AND cf.visibility IN ('parent-visible', 'public')
  AND cf.parent_acknowledged = FALSE;

  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unacknowledged_feedback_count IS 'Returns count of unacknowledged feedback for a parent';

-- ============================================================================
-- 9. INITIAL DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to create a test coach account
-- Note: You'll need to create the auth.users entry separately via Supabase Auth

/*
-- Example: Insert test coach profile (after creating auth user)
INSERT INTO user_profiles (user_id, email, role, full_name, linked_swimmer_ids)
VALUES (
  'YOUR_AUTH_USER_UUID_HERE',
  'coach@example.com',
  'coach',
  'Test Coach',
  '{}'
);

-- Example: Insert test parent profile (after creating auth user)
INSERT INTO user_profiles (user_id, email, role, full_name, linked_swimmer_ids)
VALUES (
  'YOUR_AUTH_USER_UUID_HERE',
  'parent@example.com',
  'parent',
  'Test Parent',
  ARRAY[1, 2]  -- Linked to swimmers with id 1 and 2
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after schema creation to verify everything is set up correctly

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'coach_feedback', 'feedback_acknowledgments', 'feedback_audit_log')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'coach_feedback', 'feedback_acknowledgments', 'feedback_audit_log')
ORDER BY tablename;

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'coach_feedback', 'feedback_acknowledgments', 'feedback_audit_log')
ORDER BY tablename, policyname;

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('coach_feedback')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- COMPLETION
-- ============================================================================
-- Schema setup complete!
--
-- Next steps:
-- 1. Enable Email authentication in Supabase Dashboard
-- 2. Configure email templates (confirmation, password reset)
-- 3. Test RLS policies with test accounts
-- 4. Create frontend authentication pages
--
-- Documentation: /IMPLEMENTATION_PLAN_COACH_FEEDBACK_AUTH.md
-- ============================================================================
