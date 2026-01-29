# PrepTick Deployment Guide

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/sriharsha557/preptick.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: PrepTick exam preparation platform"

# Push to GitHub
git push -u origin main
```

If you get an error about branch name, use:
```bash
git branch -M main
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Select **"Import Git Repository"**
5. Choose **sriharsha557/preptick**
6. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

7. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://mqeenbberuxzqtngkygh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZWVuYmJlcnV4enF0bmdreWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjA5MDIsImV4cCI6MjA4NTIzNjkwMn0.T3zzt3JqRYNnMgBcEehHj0qwaizCAPVPr4fTS8rt6RE
   ```

8. Click **"Deploy"**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? preptick
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Step 3: Deploy Backend (Optional - if needed)

#### Option A: Deploy to Vercel (Serverless)

The backend can run as serverless functions on Vercel:

1. Create `vercel.json` in root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

2. Add backend environment variables in Vercel dashboard

#### Option B: Deploy to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose **sriharsha557/preptick**
6. Add environment variables from `.env`
7. Railway will auto-detect and deploy

#### Option C: Deploy to Render

1. Go to https://render.com
2. Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect **sriharsha557/preptick**
5. Configure:
   - **Name**: preptick-api
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm run dev`
6. Add environment variables
7. Click **"Create Web Service"**

## 📋 Pre-Deployment Checklist

### Files to Check

- [ ] `.gitignore` includes `.env`
- [ ] `package.json` has correct scripts
- [ ] `vite.config.ts` is configured
- [ ] Environment variables documented
- [ ] README.md updated
- [ ] No sensitive data in code

### Environment Variables

#### Frontend (Vercel)
```env
VITE_SUPABASE_URL=https://mqeenbberuxzqtngkygh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Backend (Railway/Render)
```env
DATABASE_URL=postgresql://postgres:Rahul_Harsha@db.mqeenbberuxzqtngkygh.supabase.co:5432/postgres
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
```

## 🔧 Post-Deployment Configuration

### 1. Update Supabase URLs

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: 
  - `https://your-app.vercel.app/dashboard`
  - `https://your-app.vercel.app/login`

### 2. Update CORS Settings

In Supabase Dashboard → Settings → API:
- Add your Vercel domain to allowed origins

### 3. Update Backend URL (if separate)

If backend is deployed separately, update frontend API calls:

In `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://your-backend.railway.app',
        changeOrigin: true,
      }
    }
  }
})
```

Or use environment variable:
```env
VITE_API_URL=https://your-backend.railway.app
```

### 4. Test Deployment

- [ ] Homepage loads correctly
- [ ] All pages accessible
- [ ] Images and assets load
- [ ] Registration works
- [ ] Login works
- [ ] Sample paper downloads
- [ ] Contact form submits
- [ ] Mobile responsive

## 🐛 Troubleshooting

### Build Fails

**Error**: "Module not found"
```bash
# Solution: Install missing dependencies
npm install
```

**Error**: "TypeScript errors"
```bash
# Solution: Fix TypeScript errors or skip check
npm run build -- --no-typecheck
```

### Environment Variables Not Working

1. Check variable names start with `VITE_` for frontend
2. Redeploy after adding variables
3. Clear Vercel cache and redeploy

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check Supabase allows connections from Vercel IPs
3. Use connection pooler for serverless

### CORS Errors

1. Add Vercel domain to Supabase allowed origins
2. Check API proxy configuration
3. Verify backend CORS settings

## 📊 Monitoring

### Vercel Analytics

Enable in Vercel Dashboard:
- Go to your project
- Click **"Analytics"** tab
- Enable Web Analytics

### Error Tracking

Add Sentry or similar:
```bash
npm install @sentry/react @sentry/vite-plugin
```

### Performance Monitoring

Use Vercel Speed Insights:
```bash
npm install @vercel/speed-insights
```

## 🔒 Security

### Production Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable Supabase RLS policies
- [ ] Add rate limiting
- [ ] Enable HTTPS only
- [ ] Set secure headers
- [ ] Review environment variables
- [ ] Enable Vercel password protection (optional)

### Environment Variables Security

Never commit:
- `.env`
- `.env.local`
- `.env.production`

Always use Vercel/Railway environment variables dashboard.

## 🚀 Continuous Deployment

### Auto-Deploy on Push

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview

### Manual Deploy

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## 📱 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `preptick.com`)
3. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (up to 48 hours)

## 🎉 Success!

Your PrepTick application should now be live at:
- **Vercel URL**: `https://preptick.vercel.app`
- **Custom Domain**: `https://your-domain.com` (if configured)

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

**Need Help?** Check the troubleshooting section or contact support.
