-- ============================================
-- SUPABASE REALTIME ENABLEMENT SCRIPT
-- ============================================
-- IMPORTANT: Run this AFTER running supabase-setup.sql
-- This enables Realtime for all tables used in the app
-- ============================================
-- Steps:
-- 1. Go to: https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj/sql
-- 2. Click "New Query"
-- 3. Paste this entire file
-- 4. Click "Run" (or press Ctrl+Enter)
-- ============================================

-- Enable Realtime for all tables that need real-time sync
-- This allows the app to receive real-time updates when data changes
-- Note: This will skip tables that are already in the publication (no error)

DO $$
BEGIN
  -- Enable Realtime for Tasks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;

  -- Enable Realtime for Posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;

  -- Enable Realtime for Messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  -- Enable Realtime for Notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  -- Enable Realtime for Notes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notes;
  END IF;

  -- Enable Realtime for Complaints
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'complaints'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
  END IF;

  -- Enable Realtime for Emails
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'emails'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emails;
  END IF;

  -- Enable Realtime for Groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE groups;
  END IF;

  -- Enable Realtime for Users (optional - for user updates)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;

  -- Enable Realtime for Projects (optional - for project updates)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query to verify Realtime is enabled:
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t.tablename
    ) 
    THEN '✅ Enabled' 
    ELSE '❌ Not Enabled' 
  END as realtime_status
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'tasks', 'posts', 'messages', 'notifications', 
    'notes', 'complaints', 'emails', 'groups', 
    'users', 'projects'
  )
ORDER BY tablename;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- All tables now have Realtime enabled
-- Your app will receive real-time updates when:
-- - Tasks are created/updated/deleted
-- - Posts are created/liked/commented
-- - Messages are sent
-- - Notifications are created
-- - Notes are created/deleted
-- - Complaints are submitted/resolved
-- - Emails are sent
-- - Groups are created/updated
-- ============================================

