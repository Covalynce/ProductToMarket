#!/bin/bash

# Quick script to generate JWT_SECRET_KEY and ENCRYPTION_KEY
# Run this from the project root directory

echo "🔑 Generating Security Keys..."
echo "================================"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    echo "   Run this script from the project root directory"
    exit 1
fi

cd backend

# Check for virtual environment
if [ -d "venv" ]; then
    VENV_PATH="venv"
elif [ -d ".venv" ]; then
    VENV_PATH=".venv"
else
    echo "⚠️  No virtual environment found. Creating one..."
    python3 -m venv venv
    VENV_PATH="venv"
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Generate JWT Secret Key
echo "📝 Generating JWT_SECRET_KEY..."
JWT_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "✅ JWT_SECRET_KEY generated"
echo ""

# Check if cryptography is installed
echo "📝 Checking cryptography installation..."
if ! python3 -c "from cryptography.fernet import Fernet" 2>/dev/null; then
    echo "⚠️  cryptography not installed. Installing..."
    pip install -q cryptography
fi

# Generate Encryption Key
echo "📝 Generating ENCRYPTION_KEY..."
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
echo "✅ ENCRYPTION_KEY generated"
echo ""

# Output the keys
echo "================================"
echo "✅ Keys Generated Successfully!"
echo "================================"
echo ""
echo "Add these to your backend/.env file:"
echo ""
echo "JWT_SECRET_KEY=$JWT_KEY"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "⚠️  Keep these keys secure and never commit them to git!"
echo ""

# Optionally append to .env file if it exists
if [ -f ".env" ]; then
    read -p "Do you want to append these keys to backend/.env? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if keys already exist
        if grep -q "JWT_SECRET_KEY=" .env 2>/dev/null; then
            echo "⚠️  JWT_SECRET_KEY already exists in .env. Skipping..."
        else
            echo "JWT_SECRET_KEY=$JWT_KEY" >> .env
            echo "✅ Added JWT_SECRET_KEY to .env"
        fi
        
        if grep -q "ENCRYPTION_KEY=" .env 2>/dev/null; then
            echo "⚠️  ENCRYPTION_KEY already exists in .env. Skipping..."
        else
            echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env
            echo "✅ Added ENCRYPTION_KEY to .env"
        fi
    fi
else
    echo "💡 Tip: Create backend/.env file and add these keys manually"
fi

echo ""
echo "✅ Done!"

