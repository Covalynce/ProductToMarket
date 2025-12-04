# Environment Variables Setup Guide

## Step-by-Step Guide to Find All .env Keys

### Step 1: Check if .env files exist
Run these commands in your terminal:

```bash
# Check backend .env
ls -la backend/.env

# Check frontend .env
ls -la frontend/.env

# Check root .env
ls -la .env
```

### Step 2: Create .env files if they don't exist

**For Backend:**
```bash
cd backend
touch .env
```

**For Frontend:**
```bash
cd frontend
touch .env.local  # Next.js uses .env.local for local development
```

---

## Complete List of Required Environment Variables

### 🔐 Backend Environment Variables (`backend/.env`)

#### Database Configuration
```bash
# Supabase Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

#### Authentication & Security
```bash
# JWT Secret Key (auto-generated if not provided, but should be set for production)
JWT_SECRET_KEY=your_jwt_secret_key_here

# Encryption Key for sensitive data (tokens, API keys)
ENCRYPTION_KEY=your_32_character_encryption_key
```

#### AI Services
```bash
# OpenAI API Key (Global fallback - users can also provide their own)
OPENAI_API_KEY=sk-your_openai_api_key

# Grok API (xAI) - Optional, for Hinglish/sassy content
GROK_API_KEY=your_grok_api_key

# xAI API Key (Alternative Grok API)
XAI_API_KEY=your_xai_api_key

# Nano Banana API (for image generation)
NANO_BANANA_API_KEY=your_nano_banana_api_key
```

#### OAuth Provider Credentials

**GitHub OAuth:**
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**LinkedIn OAuth:**
```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

**Google OAuth:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Facebook OAuth:**
```bash
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

**Twitter OAuth:**
```bash
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

#### Payment Gateway (Razorpay)
```bash
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

#### Webhooks & Integrations
```bash
# Slack Webhook URL for Engineering alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

#### CORS Configuration
```bash
# Allowed origins (comma-separated, or "*" for all)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

### 🌐 Frontend Environment Variables (`frontend/.env.local`)

**Note:** Next.js requires `NEXT_PUBLIC_` prefix for client-side accessible variables.

```bash
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# OAuth Client IDs (Public - safe to expose)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
NEXT_PUBLIC_SLACK_CLIENT_ID=your_slack_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=your_facebook_client_id

# Razorpay Public Key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

## Step 3: How to Get Each API Key/Credential

### 1. Supabase (Database)
1. Go to https://supabase.com
2. Create a new project or select existing
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`

### 2. OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click **"Create new secret key"**
4. Copy the key → `OPENAI_API_KEY`

### 3. GitHub OAuth
1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy:
   - **Client ID** → `GITHUB_CLIENT_ID`
   - **Client Secret** → `GITHUB_CLIENT_SECRET`

### 4. LinkedIn OAuth
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Go to **Auth** tab
4. Add redirect URL: `http://localhost:3000/auth/linkedin/callback`
5. Copy:
   - **Client ID** → `LINKEDIN_CLIENT_ID`
   - **Client Secret** → `LINKEDIN_CLIENT_SECRET`

### 5. Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
4. Copy:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

### 6. Facebook OAuth
1. Go to https://developers.facebook.com/apps
2. Create a new app
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:3000/auth/facebook/callback`
5. Copy:
   - **App ID** → `FACEBOOK_CLIENT_ID`
   - **App Secret** → `FACEBOOK_CLIENT_SECRET`

### 7. Razorpay
1. Go to https://razorpay.com
2. Sign up and log in to dashboard
3. Go to **Settings** → **API Keys**
4. Generate test/live keys
5. Copy:
   - **Key ID** → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`
6. For webhooks:
   - Go to **Settings** → **Webhooks**
   - Create webhook endpoint: `https://yourdomain.com/webhook/razorpay`
   - Copy **Webhook Secret** → `RAZORPAY_WEBHOOK_SECRET`

### 8. Slack Webhook
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to **Incoming Webhooks**
4. Activate incoming webhooks
5. Create a new webhook
6. Copy the webhook URL → `SLACK_WEBHOOK_URL`

### 9. Grok/xAI API
1. Go to https://x.ai
2. Sign up for API access
3. Get API key from dashboard
4. Copy → `GROK_API_KEY` or `XAI_API_KEY`

### 10. Nano Banana API (Image Generation)
1. Go to https://nanobanana.ai (or your image generation service)
2. Sign up and get API key
3. Copy → `NANO_BANANA_API_KEY`

### 11. JWT Secret Key
Generate a secure random string:

**Option 1: Using Python (works without venv)**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 3: Using Backend Virtual Environment**
```bash
cd backend
source venv/bin/activate  # or: source .venv/bin/activate
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output → `JWT_SECRET_KEY`

### 12. Encryption Key
Generate a Fernet-compatible key:

**⚠️ IMPORTANT: You need cryptography installed**

**Option 1: Using Backend Virtual Environment (Recommended)**
```bash
cd backend
source venv/bin/activate  # Activate your virtual environment
# If cryptography is not installed:
pip install cryptography
# Then generate the key:
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Option 2: Install cryptography globally (not recommended)**
```bash
pip3 install --user cryptography
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Option 3: One-liner with venv activation**
```bash
cd backend && source venv/bin/activate && pip install -q cryptography && python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output → `ENCRYPTION_KEY`

---

## Step 4: Verify Your Setup

### Check Backend .env
```bash
cd backend
cat .env | grep -v "^#" | grep -v "^$"
```

### Check Frontend .env.local
```bash
cd frontend
cat .env.local | grep -v "^#" | grep -v "^$"
```

### Test Backend Connection
```bash
cd backend
python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print('SUPABASE_URL:', 'SET' if os.getenv('SUPABASE_URL') else 'MISSING')"
```

---

## Step 5: Missing Variables Check

Run this script to check what's missing:

```bash
# Create a check script
cat > check_env.sh << 'EOF'
#!/bin/bash

echo "=== Backend Environment Variables ==="
cd backend
if [ -f .env ]; then
    source .env
    for var in SUPABASE_URL SUPABASE_KEY JWT_SECRET_KEY ENCRYPTION_KEY OPENAI_API_KEY GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET LINKEDIN_CLIENT_ID LINKEDIN_CLIENT_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET FACEBOOK_CLIENT_ID FACEBOOK_CLIENT_SECRET TWITTER_CLIENT_ID TWITTER_CLIENT_SECRET RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET SLACK_WEBHOOK_URL; do
        if [ -z "${!var}" ]; then
            echo "❌ MISSING: $var"
        else
            echo "✅ SET: $var"
        fi
    done
else
    echo "❌ .env file not found"
fi

echo ""
echo "=== Frontend Environment Variables ==="
cd ../frontend
if [ -f .env.local ]; then
    source .env.local
    for var in NEXT_PUBLIC_API_URL NEXT_PUBLIC_GITHUB_CLIENT_ID NEXT_PUBLIC_LINKEDIN_CLIENT_ID NEXT_PUBLIC_SLACK_CLIENT_ID NEXT_PUBLIC_GOOGLE_CLIENT_ID NEXT_PUBLIC_FACEBOOK_CLIENT_ID NEXT_PUBLIC_RAZORPAY_KEY_ID; do
        if [ -z "${!var}" ]; then
            echo "❌ MISSING: $var"
        else
            echo "✅ SET: $var"
        fi
    done
else
    echo "❌ .env.local file not found"
fi
EOF

chmod +x check_env.sh
./check_env.sh
```

---

## Summary: Required vs Optional Variables

### ✅ **REQUIRED** (App won't work without these):
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `JWT_SECRET_KEY` (auto-generated if missing, but set for production)
- `ENCRYPTION_KEY` (auto-generated if missing, but set for production)
- `NEXT_PUBLIC_API_URL`

### ⚠️ **HIGHLY RECOMMENDED** (Core features need these):
- `OPENAI_API_KEY` (for AI features)
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` (for GitHub integration)
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` (for payments)

### 🔧 **OPTIONAL** (Features work without, but limited):
- `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET` (LinkedIn posting)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (Google OAuth)
- `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET` (Facebook OAuth)
- `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET` (Twitter integration)
- `SLACK_WEBHOOK_URL` (Slack notifications)
- `GROK_API_KEY` / `XAI_API_KEY` (Grok AI features)
- `NANO_BANANA_API_KEY` (Image generation)
- `RAZORPAY_WEBHOOK_SECRET` (Payment webhooks)
- `ALLOWED_ORIGINS` (CORS - defaults to "*")

---

## Quick Template Files

### Backend `.env` Template
```bash
# Copy this to backend/.env and fill in your values

# Database
SUPABASE_URL=
SUPABASE_KEY=

# Security
JWT_SECRET_KEY=
ENCRYPTION_KEY=

# AI Services
OPENAI_API_KEY=
GROK_API_KEY=
XAI_API_KEY=
NANO_BANANA_API_KEY=

# OAuth - GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth - Facebook
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# OAuth - Twitter
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Payment Gateway
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Webhooks
SLACK_WEBHOOK_URL=

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend `.env.local` Template
```bash
# Copy this to frontend/.env.local and fill in your values

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=
NEXT_PUBLIC_SLACK_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

---

## Troubleshooting

### Issue: "Environment variable not found"
- Make sure `.env` file is in the correct directory (`backend/` or `frontend/`)
- For Next.js frontend, use `.env.local` not `.env`
- Restart your development server after adding variables

### Issue: "API key invalid"
- Double-check you copied the entire key (no extra spaces)
- Some services require you to regenerate keys if copied incorrectly

### Issue: "CORS error"
- Set `ALLOWED_ORIGINS` in backend `.env` to include your frontend URL
- Make sure frontend `NEXT_PUBLIC_API_URL` matches your backend URL

---

## Security Best Practices

1. **Never commit .env files to git**
   - Add `.env` and `.env.local` to `.gitignore`
   - Use `.env.example` files with placeholder values

2. **Use different keys for development and production**
   - Development: Use test/sandbox keys
   - Production: Use live keys stored securely (e.g., Vercel/Heroku env vars)

3. **Rotate keys regularly**
   - Especially if exposed or compromised

4. **Use strong encryption keys**
   - Generate random keys using the methods above
   - Don't use predictable values

---

## Next Steps

1. ✅ Create `.env` files using the templates above
2. ✅ Fill in all required variables
3. ✅ Run the check script to verify
4. ✅ Start your backend: `cd backend && uvicorn app.main:app --reload`
5. ✅ Start your frontend: `cd frontend && npm run dev`
6. ✅ Test the application

Good luck! 🚀

