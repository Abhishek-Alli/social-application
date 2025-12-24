-- Add images column to posts table for multiple image support
-- Run this in Supabase SQL Editor

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_posts_images ON posts USING GIN (images);

