# Fix: Supabase Not Sending Verification Emails

## Problem
Supabase is not sending verification emails to users.

## Solutions

### Solution 1: Enable Email Confirmation in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Navigate to: [https://supabase.com/dashboard/project/swhdqlsqkprycexeattj](https://supabase.com/dashboard/project/swhdqlsqkprycexeattj)

2. **Go to Authentication → Email:**
   - Click **"Authentication"** in left sidebar
   - Click **"Email"** tab

3. **Enable "Confirm sign up":**
   - Find **"Confirm sign up"** toggle
   - **Turn it ON** ✅
   - This is **REQUIRED** for email verification to work

4. **Click "Save"**

### Solution 2: Check Email Rate Limits

Supabase's built-in email service has rate limits:
- **Free tier:** Limited emails per hour
- **Paid tier:** Higher limits

**If you hit rate limits:**
- Wait 1 hour and try again
- Or set up custom SMTP (see Solution 3)

### Solution 3: Set Up Custom SMTP (Recommended for Production)

For reliable email delivery, use custom SMTP:

1. **Go to Supabase Dashboard:**
   - Authentication → Email → SMTP Settings

2. **Configure SMTP:**
   - **SMTP Host:** (e.g., `smtp.gmail.com` for Gmail)
   - **SMTP Port:** (e.g., `587` for Gmail)
   - **SMTP Username:** Your email address
   - **SMTP Password:** Your email app password
   - **Sender Email:** Your email address
   - **Sender Name:** (e.g., "SRJ SOCIAL")

3. **For Gmail:**
   - Enable "Less secure app access" OR
   - Use "App Password" (recommended)
   - Generate app password: [Google Account Settings](https://myaccount.google.com/apppasswords)

4. **Click "Save"**

### Solution 4: Check Email Spam Folder

- Verification emails might go to **Spam/Junk** folder
- Check spam folder in Gmail/Outlook
- Mark as "Not Spam" if found

### Solution 5: Verify Email Address Format

Make sure email addresses are valid:
- ✅ `user@example.com` (correct)
- ❌ `user@example` (invalid)
- ❌ `user example.com` (invalid)

### Solution 6: Check Supabase Logs

1. **Go to Supabase Dashboard:**
   - Click **"Logs"** in left sidebar
   - Click **"Auth Logs"**

2. **Check for errors:**
   - Look for email sending errors
   - Check if emails are being sent but failing
   - Note any error messages

### Solution 7: Test Email Sending

1. **In Supabase Dashboard:**
   - Go to Authentication → Users
   - Click on a user
   - Click "Send verification email" button
   - Check if email is sent

2. **Check Auth Logs:**
   - See if email sending is logged
   - Check for any errors

### Solution 8: Development vs Production

**In Development:**
- Supabase might not send emails in development mode
- Check Supabase project settings
- Make sure project is not in "Paused" state

**In Production:**
- Ensure production URL is configured
- Check redirect URLs are set correctly

## Quick Checklist

- [ ] "Confirm sign up" is enabled in Supabase
- [ ] Email address is valid format
- [ ] Checked spam folder
- [ ] Checked Supabase Auth Logs for errors
- [ ] Custom SMTP configured (for production)
- [ ] Not hitting rate limits
- [ ] Project is active (not paused)

## Recommended Setup for Production

1. **Enable "Confirm sign up"** ✅
2. **Set up custom SMTP** (Gmail/SendGrid/Mailgun) ✅
3. **Configure redirect URLs** ✅
4. **Test email sending** ✅

## Gmail SMTP Configuration Example

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: [App Password from Google]
Sender Email: your-email@gmail.com
Sender Name: SRJ SOCIAL
```

**To get Gmail App Password:**
1. Go to: [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"
4. Use that password in SMTP settings

## Still Not Working?

1. **Check Supabase Status:**
   - Visit: [https://status.supabase.com](https://status.supabase.com)
   - Check if email service is down

2. **Contact Supabase Support:**
   - If all else fails, contact Supabase support
   - Provide error logs from Auth Logs

3. **Alternative: Use Custom Email Service**
   - Integrate SendGrid, Mailgun, or AWS SES
   - Send verification emails manually via API

## Test Email Sending

After configuring, test by:
1. Registering a new user
2. Checking email inbox (and spam)
3. Checking Supabase Auth Logs
4. Verifying email link works

---

**Most Common Issue:** "Confirm sign up" is not enabled in Supabase Dashboard! ✅

