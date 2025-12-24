-- ============================================
-- SUPABASE DATABASE SETUP SCRIPT
-- ============================================
-- Copy this entire file and run it in Supabase SQL Editor
-- Steps:
-- 1. Go to: https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj/sql
-- 2. Click "New Query"
-- 3. Paste this entire file
-- 4. Click "Run" (or press Ctrl+Enter)
-- ============================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager_name TEXT,
  password TEXT,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  parent_id TEXT,
  project_id TEXT REFERENCES projects(id),
  employee_id TEXT,
  department TEXT,
  sub_department TEXT,
  designation TEXT,
  dob TEXT,
  contact_no TEXT,
  profile_photo TEXT,
  password TEXT,
  is_two_step_enabled BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  telegram_user_id TEXT,
  telegram_token TEXT
);

-- Step 4: Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sub_tasks JSONB DEFAULT '[]'::jsonb,
  assigned_by TEXT,
  assigned_to TEXT
);

-- Step 5: Create Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create Posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  user_id TEXT REFERENCES users(id) NOT NULL,
  user_name TEXT NOT NULL,
  user_username TEXT NOT NULL,
  text TEXT NOT NULL,
  image TEXT,
  video TEXT,
  ratio TEXT,
  likes JSONB DEFAULT '[]'::jsonb,
  mentions JSONB DEFAULT '[]'::jsonb,
  hashtags JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  user_id TEXT REFERENCES users(id) NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachment JSONB
);

-- Step 8: Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  user_id TEXT REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  link_to TEXT
);

-- Step 9: Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  sender_id TEXT REFERENCES users(id) NOT NULL,
  receiver_id TEXT REFERENCES users(id),
  group_id TEXT,
  text TEXT NOT NULL,
  attachment JSONB,
  call_info JSONB,
  status TEXT DEFAULT 'sent',
  reply_to_id TEXT,
  mentions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Create Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT REFERENCES users(id) NOT NULL,
  members JSONB DEFAULT '[]'::jsonb,
  active_call JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 11: Create Emails table
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  sender_id TEXT REFERENCES users(id) NOT NULL,
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  cc JSONB DEFAULT '[]'::jsonb,
  bcc JSONB DEFAULT '[]'::jsonb,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  starred BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 11.5: Create Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  user_id TEXT REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT '#f97316',
  all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 12: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_posts_project_id ON posts(project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_project_id ON complaints(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_project ON notifications(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_groups_project_id ON groups(project_id);
CREATE INDEX IF NOT EXISTS idx_emails_project_id ON emails(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_users_project_id ON users(project_id);

-- Step 13: Disable Row Level Security (RLS) - FOR TESTING ONLY
-- ⚠️ WARNING: Only disable RLS for development/testing
-- In production, enable RLS with proper policies
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;

-- Step 14: Insert default project
INSERT INTO projects (id, name, manager_name, domain, created_at)
VALUES ('p_default', 'Main Enterprise', 'Admin', 'srj.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 15: Insert admin user
-- Credentials: Username: admin-abhishek, Password: admin@123
INSERT INTO users (
  id, 
  name, 
  email, 
  username, 
  role, 
  parent_id, 
  designation, 
  employee_id, 
  project_id, 
  password, 
  is_email_verified, 
  is_two_step_enabled
)
VALUES (
  'u1',
  'SRJ Admin',
  'admin@srj.com',
  'admin-abhishek',
  'admin',
  NULL,
  'System Administrator',
  'SRJ-001',
  'p_default',
  'admin@123',
  true,
  false
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- You can now use the application with Supabase
-- Admin Login:
--   Username: admin-abhishek
--   Password: admin@123
-- ============================================

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify that everything was created correctly:

-- 1. Check if admin user exists and see credentials:
SELECT 
  id, 
  name, 
  email, 
  username, 
  role, 
  password,
  is_email_verified,
  is_two_step_enabled,
  project_id
FROM users 
WHERE id = 'u1' OR username = 'admin-abhishek';

-- 2. Check if default project exists:
SELECT id, name, manager_name, domain, created_at 
FROM projects 
WHERE id = 'p_default';

-- 3. List all users (to see all created users):
SELECT id, username, email, role, project_id 
FROM users 
ORDER BY id;

-- 4. Count all tables to verify they were created:
SELECT 
  (SELECT COUNT(*) FROM projects) as projects_count,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM tasks) as tasks_count,
  (SELECT COUNT(*) FROM notes) as notes_count,
  (SELECT COUNT(*) FROM posts) as posts_count,
  (SELECT COUNT(*) FROM complaints) as complaints_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count,
  (SELECT COUNT(*) FROM messages) as messages_count,
  (SELECT COUNT(*) FROM groups) as groups_count,
  (SELECT COUNT(*) FROM emails) as emails_count;

-- 5. Verify admin user credentials match:
SELECT 
  CASE 
    WHEN username = 'admin-abhishek' AND password = 'admin@123' 
    THEN '✅ Credentials are correct!'
    ELSE '❌ Credentials do not match!'
  END as credential_status,
  username,
  password,
  role
FROM users 
WHERE id = 'u1';
-- ============================================

