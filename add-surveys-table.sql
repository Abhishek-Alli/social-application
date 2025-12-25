-- ============================================
-- ADD SURVEYS TABLE AND UPDATE FEEDBACK TABLE
-- ============================================
-- This SQL script creates the surveys table and updates the feedback table
-- IMPORTANT: You MUST run add-feedback-table.sql FIRST before running this script!
-- ============================================

-- Create Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  created_by TEXT REFERENCES users(id) NOT NULL,
  created_by_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  program_name TEXT,
  event_name TEXT,
  type TEXT NOT NULL DEFAULT 'general', -- 'program', 'event', or 'general'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'closed'
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add survey_id column to feedback table (if it doesn't exist)
-- IMPORTANT: The feedback table must exist first (run add-feedback-table.sql before this!)
-- The surveys table is created above, so we can now reference it
DO $$ 
BEGIN
  -- Check if feedback table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'feedback'
  ) THEN
    -- Check if survey_id column doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'survey_id'
    ) THEN
      ALTER TABLE feedback ADD COLUMN survey_id TEXT REFERENCES surveys(id);
      RAISE NOTICE 'Added survey_id column to feedback table';
    ELSE
      RAISE NOTICE 'survey_id column already exists in feedback table';
    END IF;
  ELSE
    RAISE EXCEPTION 'Feedback table does not exist! Please run add-feedback-table.sql FIRST before running this script.';
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_surveys_project_id ON surveys(project_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_survey_id ON feedback(survey_id);

-- Disable Row Level Security (RLS) - FOR TESTING ONLY
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for Surveys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'surveys'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE surveys;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the table was created:
SELECT 'surveys table created successfully!' as status;

-- Run this to verify Realtime is enabled:
SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'surveys'
    ) 
    THEN '✅ Realtime Enabled' 
    ELSE '❌ Realtime Not Enabled' 
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'surveys';

