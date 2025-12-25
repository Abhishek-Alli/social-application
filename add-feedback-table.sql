-- ============================================
-- ADD FEEDBACK TABLE
-- ============================================
-- This SQL script creates the feedback table
-- Run this in Supabase SQL Editor after running supabase-setup.sql
-- ============================================

-- Create Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  user_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_is_private ON feedback(is_private);

-- Disable Row Level Security (RLS) - FOR TESTING ONLY
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for Feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'feedback'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the table was created:
SELECT 'feedback table created successfully!' as status;

-- Run this to verify Realtime is enabled:
SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'feedback'
    ) 
    THEN '✅ Realtime Enabled' 
    ELSE '❌ Realtime Not Enabled' 
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'feedback';

