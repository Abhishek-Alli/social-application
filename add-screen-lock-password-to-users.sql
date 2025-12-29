-- Add screen_lock_password column to users table
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'screen_lock_password'
  ) THEN
    ALTER TABLE users ADD COLUMN screen_lock_password TEXT;
    RAISE NOTICE 'Added screen_lock_password column to users table';
  ELSE
    RAISE NOTICE 'screen_lock_password column already exists in users table';
  END IF;
END $$;


