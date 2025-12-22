-- ============================================
-- 2-STEP VERIFICATION (OTP) TABLE SETUP
-- ============================================
-- Run this in Supabase SQL Editor to enable real 2-step verification
-- ============================================

-- Create OTP (One-Time Password) table for 2-step verification
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);

-- Function to automatically clean up expired OTP codes (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_otp()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- The OTP table is now ready for 2-step verification
-- Codes will expire after 5 minutes (configurable in code)
-- ============================================

