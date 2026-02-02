# Database Connection Troubleshooting

**Issue:** Backend can't connect to Supabase database on Render  
**Error:** `Can't reach database server at aws-1-ap-southeast-1.pooler.supabase.com:5432`

---

## Immediate Actions

### 1. Check Supabase Database Status

Your Supabase database might be paused (free tier pauses after 7 days of inactivity).

**Steps:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Check if you see a "Resume Database" or "Unpause" button
4. If paused, click to resume the database
5. Wait 2-3 minutes for the database to fully start

### 2. Verify DATABASE_URL on Render

**Steps:**
1. Go to https://dashboard.render.com
2. Select your backend service (preptick-backend)
3. Go to "Environment" tab
4. Check if `DATABASE_URL` exists and is correct

**Correct Format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**Where to find the correct URL:**
1. Go to Supabase Dashboard
2. Click on your project
3. Go to Settings → Database
4. Under "Connection string" → "URI" → Copy the connection pooler URL
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Update DATABASE_URL on Render

If the URL is wrong or missing:

1. In Render dashboard → Environment tab
2. Edit or add `DATABASE_URL` variable
3. Paste the correct connection string from Supabase
4. Click "Save Changes"
5. Render will automatically redeploy your service

---

## Common Issues & Solutions

### Issue 1: Database Paused (Most Common)

**Symptom:** Connection timeout, can't reach database  
**Solution:** Resume database in Supabase dashboard

**Prevention:** 
- Upgrade to Supabase Pro ($25/month) for always-on database
- Or set up a cron job to ping your database daily

### Issue 2: Wrong Connection String

**Symptom:** Authentication failed or connection refused  
**Solution:** 

1. Get the correct connection string:
   - Supabase Dashboard → Settings → Database
   - Use "Connection Pooling" URL (port 5432)
   - NOT the "Direct Connection" URL (port 5432)

2. Format should be:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

### Issue 3: Password Contains Special Characters

**Symptom:** Authentication failed  
**Solution:** URL-encode special characters in password

Example:
- Password: `my@pass#word`
- Encoded: `my%40pass%23word`

Use this tool: https://www.urlencoder.org/

### Issue 4: Using Direct Connection Instead of Pooler

**Symptom:** Too many connections, connection refused  
**Solution:** Use connection pooler URL (port 5432) not direct connection (port 6543)

**Correct:** `aws-1-ap-southeast-1.pooler.supabase.com:5432`  
**Wrong:** `aws-1-ap-southeast-1.compute.amazonaws.com:6543`

### Issue 5: Firewall/Network Issues

**Symptom:** Timeout, can't reach server  
**Solution:** 

1. Check Supabase network restrictions:
   - Supabase Dashboard → Settings → Database
   - Under "Network Restrictions"
   - Ensure "Allow all IP addresses" is enabled
   - Or add Render's IP ranges

2. Render doesn't have static IPs on free tier, so you need to allow all IPs

---

## Testing Database Connection

### Test from Render Logs

1. Go to Render Dashboard → Your Service → Logs
2. Look for connection errors
3. Check if you see:
   - "Server listening on port 3000" ✅ Good
   - "Can't reach database server" ❌ Bad

### Test Locally

Run this command locally to test the connection string:

```bash
# Windows PowerShell
$env:DATABASE_URL="your-connection-string-here"
npm run dev
```

If it works locally but not on Render, the issue is with Render's environment variables.

---

## Step-by-Step Fix Guide

### Step 1: Resume Supabase Database
1. Go to https://supabase.com/dashboard
2. Select your project
3. If you see "Resume" or "Unpause", click it
4. Wait 2-3 minutes

### Step 2: Get Correct Connection String
1. In Supabase Dashboard → Settings → Database
2. Scroll to "Connection string"
3. Select "URI" tab
4. Toggle "Use connection pooling" to ON
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Update Render Environment Variable
1. Go to https://dashboard.render.com
2. Select your backend service
3. Go to "Environment" tab
4. Find `DATABASE_URL` or add it if missing
5. Paste the connection string from Step 2
6. Click "Save Changes"

### Step 4: Wait for Deployment
1. Render will automatically redeploy (takes 2-3 minutes)
2. Check logs for "Server listening on port 3000"
3. Test the health endpoint: https://preptick-backend.onrender.com/health

### Step 5: Verify in Frontend
1. Go to https://preptick.vercel.app
2. Try logging in
3. Check if dashboard loads without errors

---

## Prevention Tips

### 1. Keep Database Active
Free tier Supabase databases pause after 7 days of inactivity.

**Options:**
- Upgrade to Pro ($25/month) for always-on database
- Set up a cron job to ping database daily
- Use Render Cron Jobs (free) to hit your health endpoint daily

### 2. Monitor Database Status
- Set up Supabase email alerts
- Check Render logs regularly
- Use uptime monitoring (UptimeRobot, Pingdom)

### 3. Document Your Connection String
- Save it securely (1Password, LastPass)
- Don't commit to git
- Keep a backup in case you need to restore

---

## Still Not Working?

### Check Render Logs
```
1. Render Dashboard → Your Service → Logs
2. Look for specific error messages
3. Share the error with support
```

### Check Supabase Logs
```
1. Supabase Dashboard → Logs
2. Check for connection attempts
3. Look for authentication failures
```

### Contact Support
- Render Support: https://render.com/support
- Supabase Support: https://supabase.com/support

---

## Quick Reference

### Environment Variables Needed on Render
```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-key
NODE_ENV=production
PORT=3000
```

### Health Check Endpoint
```
https://preptick-backend.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

---

## Current Status

Based on the error, your issue is most likely:
1. ✅ **Database is paused** (most common for free tier)
2. ⚠️ Wrong DATABASE_URL on Render
3. ⚠️ Network connectivity issue

**Next Step:** Resume your Supabase database and verify the DATABASE_URL on Render.
