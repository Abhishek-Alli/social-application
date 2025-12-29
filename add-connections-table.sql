-- ============================================
-- ADD CONNECTIONS TABLE
-- ============================================
-- This SQL script creates the connections table for user networking
-- Run this in Supabase SQL Editor after running supabase-setup.sql
-- ============================================

-- Create Connections table
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) NOT NULL,
  connected_user_id TEXT REFERENCES users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id) -- Prevent duplicate connections
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON connections(created_at DESC);

-- Disable Row Level Security (RLS) - FOR TESTING ONLY
ALTER TABLE connections DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for Connections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE connections;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the table was created:
SELECT 'connections table created successfully!' as status;

-- Run this to verify Realtime is enabled:
SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'connections'
    ) 
    THEN '✅ Realtime Enabled' 
    ELSE '❌ Realtime Not Enabled' 
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'connections';



