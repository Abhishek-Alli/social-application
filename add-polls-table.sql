-- ============================================
-- ADD POLLS TABLE
-- ============================================
-- This SQL script creates the polls table
-- IMPORTANT: Run this after add-feedback-table.sql and add-surveys-table.sql
-- ============================================

-- Create Polls table
CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  created_by TEXT REFERENCES users(id) NOT NULL,
  created_by_name TEXT NOT NULL,
  question TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {id, text, votes, voters}
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'closed'
  allow_multiple_votes BOOLEAN DEFAULT FALSE,
  show_results_before_voting BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_polls_project_id ON polls(project_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

-- Disable Row Level Security (RLS) - FOR TESTING ONLY
ALTER TABLE polls DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for Polls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'polls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE polls;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the table was created:
SELECT 'polls table created successfully!' as status;

-- Run this to verify Realtime is enabled:
SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'polls'
    ) 
    THEN '✅ Realtime Enabled' 
    ELSE '❌ Realtime Not Enabled' 
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'polls';



