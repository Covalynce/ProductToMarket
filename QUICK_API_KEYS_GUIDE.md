# Quick API Keys Guide - Where to Get Each Variable

## 🔍 Quick Reference: Do You Need These?

### If you see these in your .env file, here's what they are:

---

## 🤖 AI Services (Optional - Only if you want these features)

### `GROK_API_KEY` or `XAI_API_KEY`
**What it's for:** Grok AI (xAI) - Alternative AI for Hinglish/sassy content generation
**Do you need it?** ❌ **NO** - Optional. Only needed if you want to use Grok instead of OpenAI
**Where to get it:**
1. Go to https://x.ai
2. Sign up for API access (may require waitlist)
3. Get API key from dashboard
**Can you skip it?** ✅ **YES** - Your app works fine with just OpenAI

### `NANO_BANANA_API_KEY`
**What it's for:** Image generation service
**Do you need it?** ❌ **NO** - Optional. Only needed for AI image generation feature
**Where to get it:**
1. Go to https://nanobanana.ai (or your preferred image generation service)
2. Sign up and get API key
**Can you skip it?** ✅ **YES** - Image generation won't work, but rest of app works fine

---

## 🔐 OAuth Providers (Optional - Only if you want those integrations)

### `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET`
**What it's for:** LinkedIn OAuth - Post content to LinkedIn
**Do you need it?** ⚠️ **Only if you want LinkedIn posting**
**Where to get it:**
1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in app details
4. Go to **Auth** tab
5. Add redirect URL: `http://localhost:3000/auth/linkedin/callback`
6. Copy **Client ID** → `LINKEDIN_CLIENT_ID`
7. Copy **Client Secret** → `LINKEDIN_CLIENT_SECRET`
**Can you skip it?** ✅ **YES** - LinkedIn posting won't work, but GitHub integration still works

### `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
**What it's for:** Google OAuth - Google account integration
**Do you need it?** ⚠️ **Only if you want Google OAuth**
**Where to get it:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
4. Copy **Client ID** → `GOOGLE_CLIENT_ID`
5. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`
**Can you skip it?** ✅ **YES** - Google OAuth won't work, but other features work

### `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET`
**What it's for:** Facebook OAuth - Facebook integration
**Do you need it?** ⚠️ **Only if you want Facebook integration**
**Where to get it:**
1. Go to https://developers.facebook.com/apps
2. Create a new app
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:3000/auth/facebook/callback`
5. Copy **App ID** → `FACEBOOK_CLIENT_ID`
6. Copy **App Secret** → `FACEBOOK_CLIENT_SECRET`
**Can you skip it?** ✅ **YES** - Facebook won't work, but other features work

### `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET`
**What it's for:** Twitter/X OAuth - Twitter integration
**Do you need it?** ⚠️ **Only if you want Twitter integration**
**Where to get it:**
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app
3. Get API keys
4. Copy **Client ID** → `TWITTER_CLIENT_ID`
5. Copy **Client Secret** → `TWITTER_CLIENT_SECRET`
**Can you skip it?** ✅ **YES** - Twitter won't work, but other features work

---

## 💰 Payment & Webhooks (Optional - Only if you want payments)

### `RAZORPAY_WEBHOOK_SECRET`
**What it's for:** Razorpay webhook verification for payment events
**Do you need it?** ⚠️ **Only if you want payment webhooks**
**Where to get it:**
1. Go to https://razorpay.com → Dashboard
2. Go to **Settings** → **Webhooks**
3. Create webhook endpoint: `https://yourdomain.com/webhook/razorpay`
4. Copy **Webhook Secret** → `RAZORPAY_WEBHOOK_SECRET`
**Can you skip it?** ✅ **YES** - Webhooks won't work, but manual payment verification still works

### `SLACK_WEBHOOK_URL`
**What it's for:** Slack notifications for Engineering alerts
**Do you need it?** ⚠️ **Only if you want Slack notifications**
**Where to get it:**
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to **Incoming Webhooks**
4. Activate incoming webhooks
5. Create a new webhook
6. Copy the webhook URL → `SLACK_WEBHOOK_URL`
**Can you skip it?** ✅ **YES** - Slack notifications won't work, but rest of app works

---

## 🌐 CORS Configuration (Optional - Has Default)

### `ALLOWED_ORIGINS`
**What it's for:** CORS configuration - which domains can access your API
**Do you need it?** ⚠️ **Optional** - Defaults to "*" (all origins) if not set
**Where to set it:**
- For local development: `ALLOWED_ORIGINS=http://localhost:3000`
- For production: `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
**Can you skip it?** ✅ **YES** - Defaults to "*" (allows all origins)

---

## ✅ **MINIMUM REQUIRED SETUP** (App will work with just these)

If you want to get started quickly, you only need:

```bash
# Database (REQUIRED)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Security (REQUIRED - but we already generated these)
JWT_SECRET_KEY=ajGEHeXhs8THsVupE3lwkVJd6wmUMs1rwMlxoxyfwOg
ENCRYPTION_KEY=cNmQPQaortKP-y_0wJ_9h2ulDu6cslPRXCxXFnNOjx8=

# AI (RECOMMENDED for core features)
OPENAI_API_KEY=sk-your_key_here

# GitHub OAuth (RECOMMENDED for GitHub integration)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Payment (RECOMMENDED if you want payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**Everything else is optional!** You can add them later as you need those features.

---

## 🎯 **Quick Decision Guide**

**Question: Do I need to add [variable]?**

- **If it's for a feature you don't use:** ❌ Skip it
- **If it's for a feature you want:** ✅ Add it
- **If you're not sure:** ❌ Skip it for now, add later when needed

**The app will work fine with missing optional variables - those features just won't be available.**

---

## 📝 **How to Handle Missing Variables**

If a variable is missing:
1. The app will use default values or skip that feature
2. You'll see warnings in logs, but the app won't crash
3. You can add it later when you need that feature

**Example:** If `GROK_API_KEY` is missing:
- ✅ App still works
- ✅ OpenAI features still work
- ❌ Grok/Hinglish features won't work
- 💡 You can add it later when you want Grok features

---

## 🚀 **Recommended Setup Order**

1. **Start with minimum required** (Database + Security keys)
2. **Add OpenAI** (for AI features)
3. **Add GitHub OAuth** (for GitHub integration)
4. **Add Razorpay** (if you want payments)
5. **Add other OAuth providers** (as you need them)
6. **Add optional features** (Grok, image generation, etc.)

You don't need everything at once! 🎉

