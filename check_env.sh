#!/bin/bash

# Environment Variables Checker Script
# This script checks which environment variables are set and which are missing

echo "🔍 Checking Environment Variables..."
echo "======================================"
echo ""

# Backend Environment Variables
echo "📦 BACKEND (.env)"
echo "-------------------"
cd backend 2>/dev/null || { echo "❌ Backend directory not found"; exit 1; }

if [ -f .env ]; then
    # Source the .env file
    set -a
    source .env 2>/dev/null
    set +a
    
    # Required variables
    REQUIRED_BACKEND=(
        "SUPABASE_URL"
        "SUPABASE_KEY"
        "JWT_SECRET_KEY"
        "ENCRYPTION_KEY"
    )
    
    # Recommended variables
    RECOMMENDED_BACKEND=(
        "OPENAI_API_KEY"
        "GITHUB_CLIENT_ID"
        "GITHUB_CLIENT_SECRET"
        "RAZORPAY_KEY_ID"
        "RAZORPAY_KEY_SECRET"
    )
    
    # Optional variables
    OPTIONAL_BACKEND=(
        "LINKEDIN_CLIENT_ID"
        "LINKEDIN_CLIENT_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "FACEBOOK_CLIENT_ID"
        "FACEBOOK_CLIENT_SECRET"
        "TWITTER_CLIENT_ID"
        "TWITTER_CLIENT_SECRET"
        "GROK_API_KEY"
        "XAI_API_KEY"
        "NANO_BANANA_API_KEY"
        "RAZORPAY_WEBHOOK_SECRET"
        "SLACK_WEBHOOK_URL"
        "ALLOWED_ORIGINS"
    )
    
    echo "✅ REQUIRED Variables:"
    MISSING_REQUIRED=0
    for var in "${REQUIRED_BACKEND[@]}"; do
        if [ -z "${!var}" ]; then
            echo "   ❌ MISSING: $var"
            MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
        else
            echo "   ✅ SET: $var"
        fi
    done
    
    echo ""
    echo "⚠️  RECOMMENDED Variables:"
    MISSING_RECOMMENDED=0
    for var in "${RECOMMENDED_BACKEND[@]}"; do
        if [ -z "${!var}" ]; then
            echo "   ⚠️  MISSING: $var"
            MISSING_RECOMMENDED=$((MISSING_RECOMMENDED + 1))
        else
            echo "   ✅ SET: $var"
        fi
    done
    
    echo ""
    echo "🔧 OPTIONAL Variables:"
    MISSING_OPTIONAL=0
    for var in "${OPTIONAL_BACKEND[@]}"; do
        if [ -z "${!var}" ]; then
            echo "   ⚪ NOT SET: $var (optional)"
            MISSING_OPTIONAL=$((MISSING_OPTIONAL + 1))
        else
            echo "   ✅ SET: $var"
        fi
    done
    
    echo ""
    echo "📊 Summary:"
    echo "   Required: $(( ${#REQUIRED_BACKEND[@]} - MISSING_REQUIRED ))/${#REQUIRED_BACKEND[@]} set"
    echo "   Recommended: $(( ${#RECOMMENDED_BACKEND[@]} - MISSING_RECOMMENDED ))/${#RECOMMENDED_BACKEND[@]} set"
    echo "   Optional: $(( ${#OPTIONAL_BACKEND[@]} - MISSING_OPTIONAL ))/${#OPTIONAL_BACKEND[@]} set"
    
    if [ $MISSING_REQUIRED -gt 0 ]; then
        echo ""
        echo "❌ ERROR: $MISSING_REQUIRED required variable(s) missing!"
        echo "   The app will not work properly without these."
    fi
    
else
    echo "❌ .env file not found in backend/"
    echo "   Create it using: touch backend/.env"
fi

echo ""
echo ""

# Frontend Environment Variables
echo "🌐 FRONTEND (.env.local)"
echo "-------------------------"
cd ../frontend 2>/dev/null || { echo "❌ Frontend directory not found"; exit 1; }

if [ -f .env.local ]; then
    # Source the .env.local file
    set -a
    source .env.local 2>/dev/null
    set +a
    
    # Required variables
    REQUIRED_FRONTEND=(
        "NEXT_PUBLIC_API_URL"
    )
    
    # Recommended variables
    RECOMMENDED_FRONTEND=(
        "NEXT_PUBLIC_GITHUB_CLIENT_ID"
        "NEXT_PUBLIC_RAZORPAY_KEY_ID"
    )
    
    # Optional variables
    OPTIONAL_FRONTEND=(
        "NEXT_PUBLIC_LINKEDIN_CLIENT_ID"
        "NEXT_PUBLIC_SLACK_CLIENT_ID"
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
        "NEXT_PUBLIC_FACEBOOK_CLIENT_ID"
    )
    
    echo "✅ REQUIRED Variables:"
    MISSING_REQUIRED_F=0
    for var in "${REQUIRED_FRONTEND[@]}"; do
        if [ -z "${!var}" ]; then
            echo "   ❌ MISSING: $var"
            MISSING_REQUIRED_F=$((MISSING_REQUIRED_F + 1))
        else
            echo "   ✅ SET: $var"
        fi
    done
    
    echo ""
    echo "⚠️  RECOMMENDED Variables:"
    MISSING_RECOMMENDED_F=0
    for var in "${RECOMMENDED_FRONTEND[@]}"; do
        if [ -z "${!var}" ]; then
            echo "   ⚠️  MISSING: $var"
            MISSING_RECOMMENDED_F=$((MISSING_RECOMMENDED_F + 1))
        else
            echo "   ✅ SET: $var"
        fi
    done
    
    echo ""
    echo "🔧 OPTIONAL Variables:"
    MISSING_OPTIONAL_F=0
    for var in "${OPTIONAL_FRONTEND[@]}"; do
        if [ -z "${!var}" ]; then
            echo "   ⚪ NOT SET: $var (optional)"
            MISSING_OPTIONAL_F=$((MISSING_OPTIONAL_F + 1))
        else
            echo "   ✅ SET: $var"
        fi
    done
    
    echo ""
    echo "📊 Summary:"
    echo "   Required: $(( ${#REQUIRED_FRONTEND[@]} - MISSING_REQUIRED_F ))/${#REQUIRED_FRONTEND[@]} set"
    echo "   Recommended: $(( ${#RECOMMENDED_FRONTEND[@]} - MISSING_RECOMMENDED_F ))/${#RECOMMENDED_FRONTEND[@]} set"
    echo "   Optional: $(( ${#OPTIONAL_FRONTEND[@]} - MISSING_OPTIONAL_F ))/${#OPTIONAL_FRONTEND[@]} set"
    
    if [ $MISSING_REQUIRED_F -gt 0 ]; then
        echo ""
        echo "❌ ERROR: $MISSING_REQUIRED_F required variable(s) missing!"
    fi
    
else
    echo "❌ .env.local file not found in frontend/"
    echo "   Create it using: touch frontend/.env.local"
fi

echo ""
echo "======================================"
echo "✅ Check complete!"
echo ""
echo "📖 For detailed setup instructions, see: ENV_SETUP_GUIDE.md"

