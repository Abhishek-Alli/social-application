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

When deploying to production platforms:

1. **Vercel:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = `https://swhdqlsqkprycyxeattj.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_u4IiPDFlyaM0BofTuQPUbQ_0W_p_d3b`

2. **Netlify:**
   - Go to Site Settings → Environment Variables
   - Add the same variables

3. **Other Platforms:**
   - Add environment variables in your platform's settings
   - Use the same variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

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

