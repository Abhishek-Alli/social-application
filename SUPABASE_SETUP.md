# Supabase Setup Guide

## Environment Variables

Create a `.env` file in the root directory with:

```
VITE_SUPABASE_URL=https://swhdqlsqkprycyxeattj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b
```

**Note:** The credentials are also hardcoded in `supabase.config.ts` as fallback, but using environment variables is recommended for security.

## Database Schema

### How to Access Supabase SQL Editor:

1. Go to your Supabase Dashboard: https://swhdqlsqkprycyxeattj.supabase.co
2. Login with your Supabase account
3. In the left sidebar, click on **"SQL Editor"** (or go to: https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj/sql)
4. Click **"New Query"** button
5. Copy and paste the SQL commands below (or use the `supabase-setup.sql` file)
6. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

### Quick Setup (Recommended):

**Easiest way:** Open the `supabase-setup.sql` file in this project, copy all contents, and paste it in Supabase SQL Editor, then click Run. This will set up everything in one go!

### Manual Setup (Step by Step):

If you prefer to run commands step by step, follow the sections below:

### Step 1: Create All Tables

Run these SQL commands in your Supabase SQL Editor to create the required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager_name TEXT,
  password TEXT,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
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

-- Tasks table
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

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
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

-- Complaints table
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

-- Notifications table
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

-- Messages table
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

-- Groups table
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

-- Emails table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_posts_project_id ON posts(project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_project_id ON complaints(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_project ON notifications(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_groups_project_id ON groups(project_id);
CREATE INDEX IF NOT EXISTS idx_emails_project_id ON emails(project_id);
CREATE INDEX IF NOT EXISTS idx_users_project_id ON users(project_id);
```

### Step 3: Disable Row Level Security (RLS) - For Testing Only

After creating the tables, you'll need to set up Row Level Security policies in Supabase. For now, you can disable RLS for testing, but in production, you should enable it with appropriate policies.

**⚠️ Important:** Only disable RLS for development/testing. In production, enable RLS with proper policies.

To disable RLS temporarily (for testing only):

```sql
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
```

## Usage

The Supabase service is ready to use. Import the services from `services/supabaseService.ts`:

```typescript
import { userService, projectService, taskService } from './services/supabaseService';

// Example: Get all users
const users = await userService.getAll();

// Example: Create a task
const newTask = await taskService.create({
  projectId: 'p_default',
  title: 'New Task',
  description: 'Task description',
  priority: 'high',
  category: 'work',
  dueDate: new Date().toISOString(),
  completed: false,
  subTasks: []
});
```

### Step 2: Seed Admin User

After creating the tables (Step 1), run this SQL to insert the default admin user and project:

```sql
-- Insert default project
INSERT INTO projects (id, name, manager_name, domain, created_at)
VALUES ('p_default', 'Main Enterprise', 'Admin', 'srj.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert admin user
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
```

**Admin Credentials:**
- **Username:** `admin-abhishek`
- **Password:** `admin@123`

## Migration from localStorage

To migrate existing localStorage data to Supabase, you can create a migration script that:
1. Reads data from localStorage
2. Uses the service functions to insert data into Supabase
3. Clears localStorage after successful migration

