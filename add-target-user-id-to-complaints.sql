-- Add target_user_id column to complaints table
-- Run this in Supabase SQL Editor

ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS target_user_id TEXT REFERENCES users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_target_user_id ON complaints(target_user_id);

