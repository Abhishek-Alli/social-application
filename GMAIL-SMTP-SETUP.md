# Gmail SMTP Setup for Supabase

## Step-by-Step Configuration

### Step 1: Get Gmail App Password

1. **Go to Google Account:**
   - Visit: [https://myaccount.google.com/](https://myaccount.google.com/)
   - Sign in with: `abhishek.srj.da@gmail.com`

2. **Enable 2-Step Verification (if not already enabled):**
   - Go to: Security → 2-Step Verification
   - Enable it if not already done

3. **Generate App Password:**
   - Go to: Security → 2-Step Verification → App Passwords
   - Or direct link: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select app: **"Mail"**
   - Select device: **"Other (Custom name)"**
   - Enter name: **"Supabase"**
   - Click **"Generate"**
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 2: Fill SMTP Settings in Supabase

In the SMTP Settings page, fill these values:

#### **Host:**
```
smtp.gmail.com
```

#### **Port number:**
```
587
```
(Change from 465 to 587 - 587 is better for Gmail)

#### **Username:**
```
abhishek.srj.da@gmail.com
```
(Your Gmail address)

#### **Password:**
```
[Paste the 16-character App Password from Step 1]
```
(Remove spaces if any - should be 16 characters)

### Step 3: Enable Custom SMTP

1. **Fill all fields** (Host, Port, Username, Password)
2. **Toggle "Enable custom SMTP"** to **ON** (green)
3. **Click "Save changes"** button (green button at bottom)

### Step 4: Verify Settings

After saving:
- ✅ Sender email: `abhishek.srj.da@gmail.com`
- ✅ Sender name: `SRJ SOCIAL`
- ✅ Host: `smtp.gmail.com`
- ✅ Port: `587`
- ✅ Username: `abhishek.srj.da@gmail.com`
- ✅ Password: `[Your App Password]`

## Complete Configuration Summary

```
Enable custom SMTP: ON ✅

Sender Email: abhishek.srj.da@gmail.com
Sender Name: SRJ SOCIAL

Host: smtp.gmail.com
Port: 587
Username: abhishek.srj.da@gmail.com
Password: [16-character App Password]
```

## Important Notes

⚠️ **Port 587 vs 465:**
- Port **587** (TLS) - Recommended for Gmail
- Port **465** (SSL) - Also works, but 587 is better
- Change from 465 to 587 in the Port field

⚠️ **App Password:**
- Use **App Password**, NOT your regular Gmail password
- App Password is 16 characters (no spaces)
- If you see spaces, remove them

⚠️ **2-Step Verification Required:**
- You MUST enable 2-Step Verification first
- Without it, App Password won't work

## Troubleshooting

### If "Save changes" button is disabled:
- Make sure ALL fields are filled
- Check Host, Port, Username, Password are all entered

### If emails still don't send:
1. **Check App Password:**
   - Make sure you copied the full 16-character password
   - No spaces in password field

2. **Check Port:**
   - Use 587 (not 465)
   - 587 is more reliable for Gmail

3. **Check 2-Step Verification:**
   - Must be enabled to generate App Password

4. **Test Email:**
   - Go to Authentication → Users
   - Click on a user
   - Click "Send verification email"
   - Check if it works

## After Configuration

1. **Test Registration:**
   - Register a new user
   - Check email inbox
   - Verification email should arrive

2. **Check Auth Logs:**
   - Go to Logs → Auth Logs
   - See if emails are being sent successfully

3. **Check Spam Folder:**
   - First email might go to spam
   - Mark as "Not Spam" if found

## Quick Checklist

- [ ] 2-Step Verification enabled in Google Account
- [ ] App Password generated (16 characters)
- [ ] Host: `smtp.gmail.com`
- [ ] Port: `587`
- [ ] Username: `abhishek.srj.da@gmail.com`
- [ ] Password: [App Password]
- [ ] "Enable custom SMTP" toggle ON
- [ ] Clicked "Save changes"
- [ ] Tested by sending verification email

## Alternative: If Gmail Doesn't Work

If Gmail SMTP has issues, you can use:

1. **SendGrid** (Free tier available)
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: [SendGrid API Key]

2. **Mailgun** (Free tier available)
   - Host: `smtp.mailgun.org`
   - Port: `587`
   - Username: [Mailgun SMTP Username]
   - Password: [Mailgun SMTP Password]

But Gmail should work fine with App Password! ✅

