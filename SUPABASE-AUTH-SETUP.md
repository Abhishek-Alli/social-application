# Supabase Authentication Email Setup Guide

## Overview
This guide shows how to enable Supabase's built-in email authentication features.

## Step 1: Enable Email Authentication in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj
2. Click on **"Authentication"** in the left sidebar
3. Click on **"Email"** under NOTIFICATIONS section
4. Enable the following features:

### Required Settings:

✅ **Confirm sign up** - Enable this
   - This will require users to verify their email before they can sign in
   - Users will receive a verification email with a link/OTP

✅ **Invite user** - Optional (for admin to invite users)
   - Allows admins to send invitation emails

✅ **Magic link** - Optional
   - Allows passwordless login via email link

✅ **Change email address** - Enable this
   - Requires verification when users change their email

✅ **Reset password** - Enable this
   - Allows users to reset forgotten passwords

✅ **Reauthentication** - Optional
   - Requires re-authentication for sensitive actions

## Step 2: Configure SMTP (Recommended for Production)

⚠️ **Important:** By default, Supabase uses a built-in email service with rate limits.

### For Production:
1. In Supabase Dashboard → Authentication → Email
2. Scroll to **"SMTP Settings"**
3. Configure your custom SMTP:
   - **SMTP Host:** (e.g., smtp.gmail.com, smtp.sendgrid.com)
   - **SMTP Port:** (e.g., 587 for TLS, 465 for SSL)
   - **SMTP User:** Your email address
   - **SMTP Password:** Your email app password
   - **Sender Email:** The email address that will send verification emails
   - **Sender Name:** (e.g., "SRJ SOCIAL")

### Popular SMTP Providers:
- **Gmail:** smtp.gmail.com:587
- **SendGrid:** smtp.sendgrid.net:587
- **Mailgun:** smtp.mailgun.org:587
- **AWS SES:** email-smtp.region.amazonaws.com:587

## Step 3: Email Templates (Optional)

You can customize email templates in:
- Supabase Dashboard → Authentication → Email Templates

Customize:
- **Confirm signup** email template
- **Magic Link** email template
- **Change Email Address** email template
- **Reset Password** email template

## Step 4: How It Works

### Registration Flow:
1. User fills registration form
2. App calls `supabase.auth.signUp(email, password)`
3. Supabase sends verification email automatically
4. User clicks link in email OR enters OTP code
5. Email verified → User can sign in

### Login Flow:
1. User enters email and password
2. App calls `supabase.auth.signInWithPassword(email, password)`
3. If email not verified → Error message
4. If verified → Login successful

### Email Verification:
- **Method 1:** User clicks link in email (redirects to app)
- **Method 2:** User enters OTP code from email
- **Method 3:** User enters token from email

## Step 5: Integration with Current App

The app now has `supabaseAuthService.ts` which provides:
- `signUp()` - Register with email verification
- `verifyEmail()` - Verify email with OTP/token
- `resendVerificationEmail()` - Resend verification email
- `signIn()` - Login with email/password
- `resetPassword()` - Send password reset email

## Current Implementation Status

✅ Supabase Auth service created
⚠️ Need to integrate with existing registration/login flow
⚠️ Need to update forms to use Supabase Auth

## Testing

### Test Email Verification:
1. Register a new user
2. Check email inbox (or Supabase logs)
3. Click verification link OR enter OTP
4. Try to login

### Check Email Logs:
- Supabase Dashboard → Authentication → Logs
- See all sent emails and their status

## Troubleshooting

### Emails not sending?
1. Check SMTP settings
2. Check email logs in Supabase Dashboard
3. Verify sender email is configured
4. Check spam folder

### Verification not working?
1. Check if "Confirm sign up" is enabled
2. Verify email template is correct
3. Check OTP/token is correct
4. Check expiration time (default: 1 hour)

## Next Steps

1. ✅ Enable email features in Supabase Dashboard
2. ⚠️ Configure SMTP (for production)
3. ⚠️ Update registration flow to use `supabaseAuthService.signUp()`
4. ⚠️ Update login flow to use `supabaseAuthService.signIn()`
5. ⚠️ Update email verification to use `supabaseAuthService.verifyEmail()`

## Benefits of Using Supabase Auth

✅ **Automatic email sending** - No need to configure email service
✅ **Built-in security** - Rate limiting, token expiration
✅ **Email templates** - Customizable email designs
✅ **Email logs** - Track all sent emails
✅ **Multiple methods** - Link, OTP, or token verification
✅ **Production ready** - Works out of the box

