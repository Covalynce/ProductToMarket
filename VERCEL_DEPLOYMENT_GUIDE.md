# Vercel Deployment Guide for Covalynce Platform Frontend

## ✅ Pre-Deployment Checklist

Your frontend is now Vercel-ready! Here's what has been configured:

- ✅ `next.config.ts` - Next.js configuration optimized for Vercel
- ✅ `vercel.json` - Vercel-specific settings and rewrites
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ Environment variables properly prefixed with `NEXT_PUBLIC_`
- ✅ Build scripts configured in `package.json`

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your repository
5. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend` (if your frontend is in a subdirectory)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

---

## 🔐 Step 3: Configure Environment Variables

**CRITICAL:** Add these environment variables in Vercel Dashboard:

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:

### Required Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

### Recommended Environment Variables:

```bash
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
NEXT_PUBLIC_SLACK_CLIENT_ID=your_slack_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=your_facebook_client_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Important Notes:**
- ✅ All frontend env vars MUST start with `NEXT_PUBLIC_`
- ✅ Set them for **Production**, **Preview**, and **Development** environments
- ✅ After adding env vars, **redeploy** your application

---

## 🔧 Step 4: Update Backend URL in vercel.json

Edit `frontend/vercel.json` and update the backend URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-actual-backend-url.onrender.com/:path*"
    }
  ]
}
```

Replace `your-actual-backend-url.onrender.com` with your actual backend URL.

**Or remove the rewrite** if you're calling the backend directly from the frontend (which you are, based on your code).

---

## 📝 Step 5: Update API URL in Code (if needed)

Your code already has a fallback:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

Make sure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables to your production backend URL.

---

## ✅ Step 6: Verify Deployment

After deployment:

1. **Check Build Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check for any build errors

2. **Test Your Application:**
   - Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Test key features:
     - API calls to backend
     - OAuth integrations
     - Payment flow (if configured)

3. **Check Environment Variables:**
   - Verify all `NEXT_PUBLIC_*` variables are accessible
   - Check browser console for any missing env var warnings

---

## 🔄 Step 7: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update OAuth redirect URLs in provider dashboards:
   - GitHub: `https://yourdomain.com/auth/github/callback`
   - LinkedIn: `https://yourdomain.com/auth/linkedin/callback`
   - Google: `https://yourdomain.com/auth/google/callback`
   - Facebook: `https://yourdomain.com/auth/facebook/callback`

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Check:**
- Build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally

**Fix:**
```bash
cd frontend
npm run build  # Test locally first
```

### Issue: Environment Variables Not Working

**Check:**
- Variables start with `NEXT_PUBLIC_`
- Variables are set for correct environment (Production/Preview)
- Redeploy after adding variables

**Fix:**
- Add variables in Vercel Dashboard → Settings → Environment Variables
- Redeploy: Vercel Dashboard → Deployments → Redeploy

### Issue: API Calls Failing

**Check:**
- `NEXT_PUBLIC_API_URL` is set correctly
- Backend CORS allows your Vercel domain
- Backend is running and accessible

**Fix:**
- Update `NEXT_PUBLIC_API_URL` in Vercel env vars
- Update `ALLOWED_ORIGINS` in backend `.env` to include your Vercel domain

### Issue: OAuth Redirects Not Working

**Check:**
- OAuth redirect URLs match your Vercel domain
- Client IDs are set correctly in Vercel env vars

**Fix:**
- Update redirect URLs in OAuth provider dashboards
- Use your Vercel URL: `https://your-app.vercel.app/auth/[provider]/callback`

---

## 📋 Environment Variables Checklist

Before deploying, ensure these are set in Vercel:

- [ ] `NEXT_PUBLIC_API_URL` - Your backend API URL
- [ ] `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth (if using)
- [ ] `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` - LinkedIn OAuth (if using)
- [ ] `NEXT_PUBLIC_SLACK_CLIENT_ID` - Slack OAuth (if using)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth (if using)
- [ ] `NEXT_PUBLIC_FACEBOOK_CLIENT_ID` - Facebook OAuth (if using)
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Razorpay (if using payments)

---

## 🎯 Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
cd frontend
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs
```

---

## 📚 Additional Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ✅ Your Frontend is Now Vercel-Ready!

Everything is configured. Just:
1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy! 🚀

Good luck with your deployment! 🎉

