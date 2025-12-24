# SQL Setup Instructions for Supabase

## ⚠️ IMPORTANT: You MUST run SQL queries in Supabase SQL Editor

For the real-time sync to work, you need to:

1. **Create the database tables** (if not already done)
2. **Enable Realtime** on all tables

## Step-by-Step Instructions

### Step 1: Run Table Creation SQL

1. Go to your Supabase Dashboard:
   - URL: `https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj/sql`
   - Or navigate: Project → SQL Editor

2. Open the file: `supabase-setup.sql`

3. Copy the **entire contents** of the file

4. In Supabase SQL Editor:
   - Click "New Query"
   - Paste the entire SQL file
   - Click "Run" (or press `Ctrl+Enter` / `Cmd+Enter`)

5. Verify it ran successfully (should see "Success" message)

### Step 2: Enable Realtime (REQUIRED for Real-Time Sync)

1. In the same SQL Editor, open: `supabase-realtime-setup.sql`

2. Copy the **entire contents** of the file

3. In Supabase SQL Editor:
   - Click "New Query"
   - Paste the SQL
   - Click "Run"

4. Verify Realtime is enabled by running the verification query at the bottom of the file

## What These SQL Queries Do

### `supabase-setup.sql`
- Creates all database tables (users, tasks, posts, messages, etc.)
- Creates indexes for better performance
- Disables Row Level Security (RLS) for testing
- Inserts default project and admin user

### `supabase-realtime-setup.sql`
- **Enables Realtime** on all tables
- This is what makes real-time sync work!
- Without this, changes won't sync between devices

## Verification

After running both SQL files, verify everything is set up:

```sql
-- Check if tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'posts', 'messages', 'notifications', 'notes', 'complaints', 'emails', 'groups', 'users', 'projects')
ORDER BY tablename;

-- Check if Realtime is enabled
SELECT 
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
  AND tablename IN ('tasks', 'posts', 'messages', 'notifications', 'notes', 'complaints', 'emails', 'groups')
ORDER BY tablename;
```

## Troubleshooting

### ❌ "Table already exists" error
- This is OK! It means tables are already created
- Just continue to Step 2 (Enable Realtime)

### ❌ "Publication does not exist" error
- This means Realtime extension is not enabled
- Go to: Project Settings → Database → Extensions
- Enable "Realtime" extension
- Then run the Realtime setup SQL again

### ❌ Real-time sync not working
- Check if Realtime is enabled (run verification query)
- Check if Realtime extension is enabled in Supabase dashboard
- Make sure you ran `supabase-realtime-setup.sql`

## Quick Checklist

- [ ] Ran `supabase-setup.sql` in SQL Editor
- [ ] Ran `supabase-realtime-setup.sql` in SQL Editor
- [ ] Verified tables exist
- [ ] Verified Realtime is enabled
- [ ] Tested real-time sync on multiple devices

## Files to Run

1. ✅ `supabase-setup.sql` - Creates tables and initial data
2. ✅ `supabase-realtime-setup.sql` - Enables Realtime (REQUIRED!)

Both files must be run in the Supabase SQL Editor for the app to work properly!




