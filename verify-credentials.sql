-- ============================================
-- VERIFY ADMIN CREDENTIALS IN SUPABASE
-- ============================================
-- Run these queries in Supabase SQL Editor to check if admin user exists
-- ============================================

-- Query 1: Check if admin user exists and see all details
SELECT 
  id, 
  name, 
  email, 
  username, 
  role, 
  password,
  is_email_verified,
  is_two_step_enabled,
  project_id,
  created_at
FROM users 
WHERE id = 'u1' OR username = 'admin-abhishek';

-- Query 2: Verify credentials match expected values
SELECT 
  CASE 
    WHEN username = 'admin-abhishek' AND password = 'admin@123' 
    THEN '✅ Credentials are CORRECT!'
    WHEN username = 'admin-abhishek' AND password != 'admin@123'
    THEN '❌ Password is INCORRECT! Expected: admin@123, Found: ' || password
    WHEN username != 'admin-abhishek'
    THEN '❌ Username is INCORRECT! Expected: admin-abhishek, Found: ' || username
    ELSE '❌ Admin user NOT FOUND!'
  END as credential_status,
  username as current_username,
  password as current_password,
  role,
  email
FROM users 
WHERE id = 'u1';

-- Query 3: Check if default project exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Default project EXISTS'
    ELSE '❌ Default project NOT FOUND'
  END as project_status,
  id,
  name,
  manager_name,
  domain
FROM projects 
WHERE id = 'p_default';

-- Query 4: List all users (to see what users exist)
SELECT 
  id, 
  username, 
  email, 
  role, 
  project_id,
  CASE 
    WHEN password IS NULL OR password = '' THEN 'No password'
    ELSE 'Password set'
  END as password_status
FROM users 
ORDER BY created_at;

-- Query 5: Quick check - Does admin user exist?
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Admin user EXISTS'
    ELSE '❌ Admin user DOES NOT EXIST'
  END as user_exists,
  COUNT(*) as count
FROM users 
WHERE username = 'admin-abhishek' OR id = 'u1';

-- Query 6: Full verification summary
SELECT 
  'Admin User Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE id = 'u1') THEN '✅ Found'
    ELSE '❌ Not Found'
  END as status,
  (SELECT username FROM users WHERE id = 'u1') as username,
  (SELECT password FROM users WHERE id = 'u1') as password
UNION ALL
SELECT 
  'Project Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM projects WHERE id = 'p_default') THEN '✅ Found'
    ELSE '❌ Not Found'
  END as status,
  (SELECT name FROM projects WHERE id = 'p_default') as username,
  NULL as password;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- Username: admin-abhishek
-- Password: admin@123
-- Email: admin@srj.com
-- Role: admin
-- Project ID: p_default
-- ============================================

