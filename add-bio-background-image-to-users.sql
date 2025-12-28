-- ============================================
-- ADD BIO AND BACKGROUND IMAGE TO USERS TABLE
-- ============================================
-- This SQL script adds bio and background_image columns to the users table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add bio column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
    RAISE NOTICE 'Added bio column to users table.';
  ELSE
    RAISE NOTICE 'bio column already exists in users table.';
  END IF;
END $$;

-- Add background_image column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'background_image'
  ) THEN
    ALTER TABLE users ADD COLUMN background_image TEXT;
    RAISE NOTICE 'Added background_image column to users table.';
  ELSE
    RAISE NOTICE 'background_image column already exists in users table.';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the columns were added:
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('bio', 'background_image')
ORDER BY column_name;


