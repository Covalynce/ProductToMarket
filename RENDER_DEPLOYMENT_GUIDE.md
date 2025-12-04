# Render Deployment Guide for Covalynce Platform Backend

## ✅ Fixed Issues

### 1. ✅ Email Validator Dependency
- Added `email-validator>=2.0.0` to `requirements.txt`
- Added `pydantic[email]>=2.9.0` for email validation support
- This fixes the `ImportError: email-validator is not installed` error

### 2. ✅ Port Configuration
- Procfile correctly uses `$PORT` environment variable
- Server binds to `0.0.0.0` and `$PORT` (Render requirement)

---

## 🚀 Step-by-Step Render Deployment

### Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Fix email-validator dependency for Render"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository
5. Configure the service:

**Basic Settings:**
- **Name:** `covalynce-backend` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your deployment branch)
- **Root Directory:** `backend` (if backend is in subdirectory)
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Advanced Settings:**
- **Auto-Deploy:** `Yes` (deploys on git push)

### Step 3: Configure Environment Variables

In Render Dashboard → Your Service → Environment, add:

#### Required Variables:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET_KEY=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
```

#### Recommended Variables:
```bash
OPENAI_API_KEY=sk-your_openai_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
SLACK_WEBHOOK_URL=your_slack_webhook_url
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

**Important:** 
- Render automatically sets `$PORT` - don't add it manually
- After adding env vars, **redeploy** your service

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Install dependencies from `requirements.txt`
   - Start your FastAPI server
   - Bind to the port automatically

### Step 5: Verify Deployment

1. **Check Build Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for: `🚀 COVALYNCE PLATFORM ENGINE ONLINE`
   - Check for any errors

2. **Test Your API:**
   - Visit: `https://your-service.onrender.com/`
   - Should see: `{"status": "online", "mode": "SAAS PRO"}`

3. **Check Health:**
   - Test endpoint: `https://your-service.onrender.com/`
   - Should return 200 OK

---

## 🔧 Render Configuration Files

### `backend/Procfile`
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

✅ **Correct** - Uses `$PORT` which Render provides automatically

### `backend/requirements.txt`
✅ **Updated** - Now includes:
- `email-validator>=2.0.0`
- `pydantic[email]>=2.9.0`

---

## 🐛 Troubleshooting

### Issue: "No open ports detected"

**Causes:**
1. App crashed before binding to port (check logs)
2. Missing dependencies (email-validator fixed)
3. Environment variables missing

**Fix:**
1. Check Render logs for errors
2. Verify all required env vars are set
3. Ensure `requirements.txt` includes all dependencies
4. Check that Procfile uses `$PORT`

### Issue: ImportError: email-validator

**Status:** ✅ **FIXED**
- Added `email-validator>=2.0.0` to requirements.txt
- Added `pydantic[email]>=2.9.0`

### Issue: App starts but returns 502/503

**Causes:**
1. App not binding to correct port
2. Health check failing
3. App crashing after startup

**Fix:**
- Verify Procfile uses `--host 0.0.0.0 --port $PORT`
- Check logs for startup errors
- Ensure all env vars are set

### Issue: CORS errors from frontend

**Fix:**
- Add your frontend URL to `ALLOWED_ORIGINS`:
  ```
  ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
  ```
- Redeploy after updating

### Issue: Database connection errors

**Fix:**
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check Supabase project is active
- Ensure Supabase allows connections from Render IPs

---

## 📋 Environment Variables Checklist

Before deploying, ensure these are set in Render:

**Required:**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_KEY`
- [ ] `JWT_SECRET_KEY`
- [ ] `ENCRYPTION_KEY`

**Recommended:**
- [ ] `OPENAI_API_KEY`
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `ALLOWED_ORIGINS`

**Optional:**
- [ ] `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET`
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- [ ] `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET`
- [ ] `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET`
- [ ] `GROK_API_KEY` / `XAI_API_KEY`
- [ ] `NANO_BANANA_API_KEY`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `SLACK_WEBHOOK_URL`

---

## 🔄 Update Frontend After Deployment

After your backend is deployed on Render:

1. **Update Frontend Environment Variable:**
   - In Vercel Dashboard → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your Render URL:
     ```
     NEXT_PUBLIC_API_URL=https://your-service.onrender.com
     ```

2. **Update Backend CORS:**
   - In Render Dashboard → Environment Variables
   - Update `ALLOWED_ORIGINS`:
     ```
     ALLOWED_ORIGINS=https://your-frontend.vercel.app
     ```

3. **Redeploy Both:**
   - Redeploy frontend on Vercel
   - Redeploy backend on Render (or it auto-deploys)

---

## 📝 Render-Specific Notes

1. **Free Tier Limitations:**
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds (cold start)
   - Consider upgrading for production

2. **Auto-Deploy:**
   - Render auto-deploys on git push to main branch
   - Check "Auto-Deploy" in service settings

3. **Health Checks:**
   - Render checks `/` endpoint
   - Your app returns `{"status": "online"}` ✅

4. **Logs:**
   - Access logs in Render Dashboard → Your Service → Logs
   - Logs are real-time and searchable

---

## ✅ Deployment Checklist

- [x] Fixed `email-validator` dependency
- [x] Procfile configured correctly
- [x] Requirements.txt updated
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables added
- [ ] Service deployed successfully
- [ ] API tested and working
- [ ] Frontend updated with backend URL
- [ ] CORS configured

---

## 🎯 Quick Deploy Commands

```bash
# 1. Commit and push
git add .
git commit -m "Ready for Render deployment"
git push origin main

# 2. Render will auto-deploy (if auto-deploy enabled)
# Or manually trigger in Render Dashboard

# 3. Check logs
# Go to Render Dashboard → Your Service → Logs
```

---

## 🚀 Your Backend is Now Render-Ready!

The `email-validator` issue is fixed. Your backend should deploy successfully on Render!

**Next Steps:**
1. Push your code to GitHub
2. Create Render Web Service
3. Add environment variables
4. Deploy!

Good luck! 🎉

