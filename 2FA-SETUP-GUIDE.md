# 2-Step Verification Setup Guide

## Overview
Real 2-step verification is now implemented using Supabase OTP (One-Time Password) system.

## Database Setup

### Option 1: If you already ran `supabase-setup.sql`
Run the additional setup file:

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj/sql
2. Open `supabase-2fa-setup.sql`
3. Copy and paste the entire content
4. Click "Run"

### Option 2: Fresh Setup
The `supabase-setup.sql` file has been updated to include the OTP table automatically.

## How It Works

### 1. OTP Generation
- When user with 2-step enabled tries to login
- System generates a 6-digit code
- Code is stored in Supabase `otp_codes` table
- Code expires in **5 minutes**
- Old unused codes are automatically deleted

### 2. OTP Verification
- User enters the 6-digit code
- System checks:
  - Code exists for the user
  - Code is not expired (within 5 minutes)
  - Code is not already used
- If valid, code is marked as used and user is logged in

### 3. Security Features
- ✅ Codes expire after 5 minutes
- ✅ Codes can only be used once
- ✅ Old codes are automatically cleaned up
- ✅ Each user can only have one active OTP at a time
- ✅ Codes are stored securely in Supabase

## Testing

### For Development/Testing:
Currently, OTP codes are shown in alerts. In production, you should:
1. Send codes via email using Supabase Edge Functions
2. Or use SMS service (Twilio, etc.)
3. Remove alert messages showing codes

### Test Flow:
1. Enable 2-step verification in user profile
2. Try to login
3. Check alert for OTP code (for testing)
4. Enter 6-digit code
5. Login successful!

## Production Setup

### Email Integration (Recommended)
1. Set up Supabase Edge Function for sending emails
2. Update `otpService.generateOTP()` to call Edge Function
3. Remove alert messages

### SMS Integration (Optional)
1. Integrate SMS service (Twilio, AWS SNS, etc.)
2. Update `otpService.generateOTP()` to send SMS
3. Remove alert messages

## Code Structure

### OTP Service (`services/supabaseService.ts`)
- `generateOTP(userId)` - Generates and stores OTP
- `verifyOTP(userId, code)` - Verifies OTP code
- `cleanupExpiredOTPs()` - Cleans up old codes

### Database Table
```sql
otp_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  code TEXT NOT NULL,
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
)
```

## Troubleshooting

### Code not working?
- Check if code is expired (5 minutes)
- Check if code was already used
- Try generating a new code

### Code not generating?
- Check Supabase connection
- Check if user has 2-step enabled
- Check browser console for errors

## Security Notes

⚠️ **Important for Production:**
1. Remove alert messages showing OTP codes
2. Implement proper email/SMS sending
3. Enable RLS (Row Level Security) on `otp_codes` table
4. Add rate limiting to prevent abuse
5. Consider adding IP-based restrictions

