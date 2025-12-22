# How to View Users Data in Supabase

## Step 1: Access Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Login with your Supabase account
3. Select your project: **swhdqlsqkprycyxeattj**

## Step 2: View Users Table

### Option A: Table Editor (Easiest)

1. In the left sidebar, click **"Table Editor"**
2. Click on **"users"** table
3. You'll see all users with their data:
   - Name, Email, Username
   - Role, Department, Designation
   - Employee ID, Contact Number
   - Password, Verification Status
   - etc.

### Option B: SQL Editor (For Queries)

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"**
3. Run these queries to view users:

```sql
-- View all users
SELECT * FROM users ORDER BY created_at DESC;

-- View specific user by username
SELECT * FROM users WHERE username = 'admin-abhishek';

-- View users by role
SELECT * FROM users WHERE role = 'employee';

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- View users with their project
SELECT 
  u.id,
  u.name,
  u.email,
  u.username,
  u.role,
  u.department,
  u.designation,
  p.name as project_name
FROM users u
LEFT JOIN projects p ON u.project_id = p.id
ORDER BY u.created_at DESC;
```

## Step 3: View Other Tables

You can also view:
- **projects** - All projects
- **tasks** - All tasks
- **notes** - All notes
- **posts** - All posts
- **complaints** - All complaints
- **emails** - All emails
- **messages** - All messages
- **groups** - All groups

## Quick Access

**Direct URL to your project:**
https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj

**Table Editor Direct Link:**
https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj/editor

## Tips

1. **Filter Data:** Use the filter button in Table Editor to search/filter users
2. **Sort Data:** Click column headers to sort
3. **Edit Data:** Click on any cell to edit directly
4. **Export Data:** Use SQL Editor to export data as CSV

## Verify New User Creation

After creating a new user in the app:
1. Go to Table Editor → users
2. Click "Refresh" button
3. New user should appear at the top (sorted by created_at DESC)

Or run this query:
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

