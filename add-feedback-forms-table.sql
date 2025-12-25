-- ============================================
-- ADD FEEDBACK FORMS AND SUBMISSIONS TABLES
-- ============================================
-- This SQL script creates the feedback_forms and feedback_form_submissions tables
-- IMPORTANT: Run this after add-feedback-table.sql
-- ============================================

-- Create Feedback Forms table
CREATE TABLE IF NOT EXISTS feedback_forms (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  created_by TEXT REFERENCES users(id) NOT NULL,
  created_by_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of form fields
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'closed'
  allow_multiple_submissions BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Feedback Form Submissions table
CREATE TABLE IF NOT EXISTS feedback_form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT REFERENCES feedback_forms(id) NOT NULL,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  user_email TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- Object mapping fieldId to response value
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_forms_project_id ON feedback_forms(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_forms_status ON feedback_forms(status);
CREATE INDEX IF NOT EXISTS idx_feedback_forms_created_at ON feedback_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_form_submissions_form_id ON feedback_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_form_submissions_project_id ON feedback_form_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_form_submissions_submitted_at ON feedback_form_submissions(submitted_at DESC);

-- Disable Row Level Security (RLS) - FOR TESTING ONLY
ALTER TABLE feedback_forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_form_submissions DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for Feedback Forms and Submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'feedback_forms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE feedback_forms;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'feedback_form_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE feedback_form_submissions;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the tables were created:
SELECT 'feedback_forms and feedback_form_submissions tables created successfully!' as status;

-- Run this to verify Realtime is enabled:
SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename IN ('feedback_forms', 'feedback_form_submissions')
    ) 
    THEN '✅ Realtime Enabled' 
    ELSE '❌ Realtime Not Enabled' 
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('feedback_forms', 'feedback_form_submissions');
