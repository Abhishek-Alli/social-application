-- ============================================
-- UPDATE TASKS TABLE FOR MULTIPLE ASSIGNEES
-- ============================================
-- This SQL script updates the tasks table to support multiple assignees
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- ============================================

-- Step 1: Add a new column for multiple assignees (as JSONB array)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_array JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing single assigned_to values to the new array format
-- Convert existing assigned_to (single user ID) to assigned_to_array (array of user IDs)
UPDATE tasks 
SET assigned_to_array = CASE 
  WHEN assigned_to IS NOT NULL AND assigned_to != '' THEN 
    jsonb_build_array(assigned_to)
  ELSE 
    '[]'::jsonb
END
WHERE assigned_to_array = '[]'::jsonb OR assigned_to_array IS NULL;

-- Step 3: Create index for efficient querying (PostgreSQL can index JSONB arrays)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_array ON tasks USING GIN (assigned_to_array);

-- Step 4: Optional - Keep the old assigned_to column for backward compatibility during migration
-- You can drop it later after verifying everything works:
-- ALTER TABLE tasks DROP COLUMN assigned_to;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the migration:
SELECT 
  id, 
  title, 
  assigned_to as old_assigned_to, 
  assigned_to_array as new_assigned_to_array
FROM tasks 
LIMIT 10;

-- Check that all tasks have the array format:
SELECT 
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE jsonb_array_length(assigned_to_array) > 0) as tasks_with_assignees,
  COUNT(*) FILTER (WHERE jsonb_array_length(assigned_to_array) = 0) as tasks_without_assignees
FROM tasks;




