# Fix Email Verification Link - Localhost Issue

## Problem

Email verification links are pointing to `localhost` instead of your production URL.

## Solution

### Step 1: Add Production URL Environment Variable

Add your production URL to environment variables:

**For Local Development (.env file):**
```env
VITE_APP_URL=http://localhost:5173
```

**For Production (Vercel/Netlify/etc.):**
```
VITE_APP_URL=https://your-production-domain.com
```

### Step 2: Configure Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Navigate to: [https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj](https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj)

2. **Go to Authentication Settings:**
   - Click on **"Authentication"** in the left sidebar
   - Click on **"URL Configuration"** or **"Redirect URLs"**

3. **Add Your Production URL:**
   - In **"Redirect URLs"** section, add:
     ```
     https://your-production-domain.com
     https://your-production-domain.com/**
     ```
   - Replace `your-production-domain.com` with your actual domain
   - For example:
     ```
     https://srj-social.vercel.app
     https://srj-social.vercel.app/**
     ```

4. **Add Localhost for Development (Optional):**
   ```
   http://localhost:5173
   http://localhost:5173/**
   ```

5. **Click "Save"**

### Step 3: Update Environment Variables in Deployment Platform

**For Vercel:**
1. Go to your project → Settings → Environment Variables
2. Add:
   ```
   Name: VITE_APP_URL
   Value: https://your-production-domain.com
   ```
3. Select all environments (Production, Preview, Development)
4. Click "Save"
5. **Redeploy** your application

**For Netlify:**
1. Go to Site Settings → Environment Variables
2. Add:
   ```
   Key: VITE_APP_URL
   Value: https://your-production-domain.com
   ```
3. Click "Save"
4. **Redeploy** your site

### Step 4: Test Email Verification

1. **Register a new user** from your production site
2. **Check email** - the verification link should now point to your production URL
3. **Click the link** - it should redirect to your production site and verify the email

## Important Notes

- ⚠️ **Supabase requires you to whitelist redirect URLs** in the dashboard
- ⚠️ **You must add your production URL** to Supabase's allowed redirect URLs
- ⚠️ **Environment variable `VITE_APP_URL`** must be set in your deployment platform
- ✅ **After adding redirect URLs in Supabase**, new emails will use the correct URL
- ✅ **Old emails** will still have localhost links (users need to request new verification email)

## Quick Fix for Existing Users

If users already received emails with localhost links:

1. They can click **"Resend Verification Email"** button
2. The new email will have the correct production URL
3. Or they can manually change `localhost:5173` to your production domain in the link

## Example

**Your Production URL:** `https://social-application-sk7a.vercel.app`

1. **Set environment variable in Vercel:**
   ```
   VITE_APP_URL=https://social-application-sk7a.vercel.app
   ```

2. **Add to Supabase Redirect URLs:**
   ```
   https://social-application-sk7a.vercel.app
   https://social-application-sk7a.vercel.app/**
   ```

3. **Redeploy** your application

After this, all new verification emails will use the production URL! 🎉

**See `SETUP-PRODUCTION-EMAIL.md` for complete step-by-step instructions.**

