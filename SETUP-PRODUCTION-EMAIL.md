# Production Email Verification Setup

## Your Production URL
**Domain:** `https://social-application-sk7a.vercel.app`

## Step 1: Add Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Navigate to: [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project: `social-application`

2. **Go to Settings:**
   - Click on **"Settings"** tab
   - Click on **"Environment Variables"** in the left sidebar

3. **Add New Variable:**
   - Click **"Add New"** button
   - **Name:** `VITE_APP_URL`
   - **Value:** `https://social-application-sk7a.vercel.app`
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

4. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on the latest deployment
   - Or create a new deployment

## Step 2: Configure Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Navigate to: [https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj](https://supabase.com/dashboard/project/swhdqlsqkprycyxeattj)

2. **Go to Authentication Settings:**
   - Click on **"Authentication"** in the left sidebar
   - Click on **"URL Configuration"** or **"Redirect URLs"**

3. **Add Your Production URL:**
   - In the **"Redirect URLs"** section, click **"Add URL"**
   - Add these URLs (one by one):
     ```
     https://social-application-sk7a.vercel.app
     ```
     ```
     https://social-application-sk7a.vercel.app/**
     ```
   - Click **"Save"** after each addition

4. **Also Add Localhost (for development):**
   - Add:
     ```
     http://localhost:5173
     ```
     ```
     http://localhost:5173/**
     ```

5. **Click "Save"** at the bottom

## Step 3: Verify Configuration

After completing both steps:

1. **Wait 2-3 minutes** for changes to propagate
2. **Register a new user** from your production site
3. **Check email** - the verification link should now be:
   ```
   https://social-application-sk7a.vercel.app/#access_token=...
   ```
   Instead of:
   ```
   http://localhost:5173/#access_token=...
   ```

## Step 4: Test Email Verification

1. Go to: [https://social-application-sk7a.vercel.app](https://social-application-sk7a.vercel.app)
2. Click **"New Personnel? Request Corporate ID"**
3. Fill the registration form
4. Submit - you'll receive an email
5. Check email - link should point to production URL
6. Click the link - it should verify and create account

## Troubleshooting

### If email still has localhost link:

1. **Check Vercel Environment Variables:**
   - Make sure `VITE_APP_URL` is set correctly
   - Make sure you **redeployed** after adding the variable

2. **Check Supabase Redirect URLs:**
   - Make sure `https://social-application-sk7a.vercel.app` is added
   - Make sure `https://social-application-sk7a.vercel.app/**` is added

3. **Request New Verification Email:**
   - Click "Resend Verification Email" button
   - New email will have correct URL

### If link doesn't work after clicking:

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Check for any errors

2. **Check URL Hash:**
   - After clicking link, URL should have `#access_token=...`
   - If not, Supabase redirect URL might be wrong

3. **Verify Supabase Settings:**
   - Make sure "Confirm sign up" is enabled in Supabase
   - Go to: Authentication → Email → Settings

## Quick Checklist

- [ ] Added `VITE_APP_URL` in Vercel environment variables
- [ ] Redeployed application in Vercel
- [ ] Added production URL to Supabase redirect URLs
- [ ] Added localhost URL to Supabase redirect URLs (for dev)
- [ ] Tested registration with new email
- [ ] Verified email link points to production URL

## Your URLs Summary

**Production:** `https://social-application-sk7a.vercel.app`  
**Local Development:** `http://localhost:5173`

Both should be added to Supabase Redirect URLs! ✅

