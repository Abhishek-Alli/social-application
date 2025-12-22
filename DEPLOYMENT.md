# Deployment Guide

## GitHub Deployment

### ✅ Database Connection

**Yes, your database will connect after pushing to GitHub**, but you need to set up environment variables properly.

### Security Setup

#### 1. Local Development

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://swhdqlsqkprycyxeattj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b
```

**⚠️ Important:** The `.env` file is already in `.gitignore` and will NOT be pushed to GitHub.

#### 2. GitHub Repository Setup

The code will work because:
- ✅ Supabase credentials are hardcoded as fallback in `supabase.config.ts`
- ✅ Environment variables take priority if set
- ✅ `.env` file is ignored by git

**However, for better security:**
- The hardcoded credentials in `supabase.config.ts` will be visible in your GitHub repo
- Anyone with access to your repo can see these credentials
- This is okay for **anon/public keys** (they're meant to be public), but not ideal

### 3. Production Deployment (Vercel/Netlify/etc.)

When deploying to production platforms, **YOU MUST SET ENVIRONMENT VARIABLES**:

1. **Vercel:**
   - Go to your project → Settings → Environment Variables
   - Click "Add New"
   - Add these variables:
     ```
     VITE_SUPABASE_URL = https://swhdqlsqkprycyxeattj.supabase.co
     VITE_SUPABASE_ANON_KEY = sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b
     VITE_APP_URL = https://social-application-sk7a.vercel.app
     ```
   - Select environment: **Production, Preview, Development** (all three)
   - Click "Save"
   - **Redeploy** your application after adding variables
   
   **Important:** `VITE_APP_URL` is required for email verification links to work correctly!

2. **Netlify:**
   - Go to Site Settings → Environment Variables
   - Click "Add a variable"
   - Add:
     ```
     VITE_SUPABASE_URL = https://swhdqlsqkprycyxeattj.supabase.co
     VITE_SUPABASE_ANON_KEY = sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b
     ```
   - Click "Save"
   - **Redeploy** your site

3. **Other Platforms:**
   - Add environment variables in your platform's settings
   - Use the same variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - **Important:** Make sure to redeploy after adding variables

### ⚠️ Common Deployment Error Fix

**Error:** `ERR_NAME_NOT_RESOLVED` or `your-project-id.supabase.co`

**Solution:**
1. Check that environment variables are set in your deployment platform
2. Make sure variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. **Redeploy** after adding environment variables (they're only available at build time)
4. Check browser console for configuration errors

### 4. Supabase Security

**Good News:** The `anon` key (public key) is safe to expose:
- It's designed to be public
- Row Level Security (RLS) protects your data
- You've already disabled RLS for testing (remember to enable it in production!)

**Important:** Never expose your `service_role` key (secret key) - that's for server-side only!

### 5. Steps to Deploy

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Supabase integration"
   git push origin main
   ```

2. **Deploy to Vercel/Netlify:**
   - Connect your GitHub repo
   - Add environment variables
   - Deploy!

3. **Verify:**
   - Check that the app connects to Supabase
   - Test login with: `admin-abhishek` / `admin@123`

### 6. Production Checklist

Before going live:
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Set up proper RLS policies
- [ ] Use environment variables (not hardcoded values)
- [ ] Test all database operations
- [ ] Verify authentication works

### Current Status

✅ **Your app will work on GitHub** - credentials are in the code  
⚠️ **For production** - use environment variables for better security  
✅ **Database will connect** - Supabase URL and key are configured

