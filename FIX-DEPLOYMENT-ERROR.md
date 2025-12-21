# Fix Deployment Error: ERR_NAME_NOT_RESOLVED

## Problem

After deploying, you see this error in console:
```
GET https://your-project-id.supabase.co/rest/v1/users?select=* 
net::ERR_NAME_NOT_RESOLVED
```

This means environment variables are not set in your deployment platform.

## Quick Fix

### For Vercel:

1. **Go to your Vercel project dashboard**
2. **Click on "Settings"** → **"Environment Variables"**
3. **Add these two variables:**

   ```
   Name: VITE_SUPABASE_URL
   Value: https://swhdqlsqkprycyxeattj.supabase.co
   ```

   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b
   ```

4. **Select all environments:** Production, Preview, Development
5. **Click "Save"**
6. **Go to "Deployments" tab**
7. **Click "Redeploy"** on the latest deployment (or create a new deployment)

### For Netlify:

1. **Go to your Netlify site dashboard**
2. **Click "Site settings"** → **"Environment variables"**
3. **Click "Add a variable"**
4. **Add:**

   ```
   Key: VITE_SUPABASE_URL
   Value: https://swhdqlsqkprycyxeattj.supabase.co
   ```

   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b
   ```

5. **Click "Save"**
6. **Go to "Deploys" tab**
7. **Click "Trigger deploy"** → **"Deploy site"**

### For Other Platforms:

1. Find "Environment Variables" or "Config" in your platform settings
2. Add the two variables above
3. **Redeploy** your application

## Why This Happens

- Vite replaces `import.meta.env.VITE_*` variables **at build time**
- If variables aren't set during build, it uses placeholder values
- You must **redeploy** after adding environment variables

## Verify It's Fixed

After redeploying:

1. Open your deployed app
2. Open browser console (F12)
3. You should see: `✅ Loaded users from Supabase: [...]`
4. Login should work with: `admin-abhishek` / `admin@123`

## Still Not Working?

1. **Check variable names:** Must be exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. **Check for typos** in the URL and key
3. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
4. **Check Supabase dashboard** - make sure your project is active
5. **Check browser console** for specific error messages

## Fallback Behavior

If Supabase connection fails, the app will:
- Show error in console
- Fall back to localStorage
- Still allow login if admin user exists in localStorage

But for full functionality, you need Supabase connection working!

