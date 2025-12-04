"""
Authentication utilities for multiple providers
"""
import os
import httpx
import hashlib
import secrets
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Integration permissions mapping
INTEGRATION_PERMISSIONS = {
    "github": [
        "Read repository information",
        "Read commit history",
        "Read pull requests",
        "Read issues"
    ],
    "linkedin": [
        "Post content on your behalf",
        "Read your profile information",
        "Access your LinkedIn account"
    ],
    "slack": [
        "Send messages to channels",
        "Post messages as you",
        "Read channel information"
    ],
    "twitter": [
        "Post tweets",
        "Read your profile",
        "Access your timeline"
    ],
    "instagram": [
        "Post photos and videos",
        "Read your profile",
        "Access your media"
    ],
    "jira": [
        "Read issues",
        "Read projects",
        "Read sprint information"
    ],
    "google": [
        "Access your Google account",
        "Read your profile",
        "Access Gmail (if needed)"
    ],
    "facebook": [
        "Post on your behalf",
        "Read your profile",
        "Access your pages"
    ]
}

def get_permissions_for_provider(provider: str) -> list:
    """Get permissions list for a provider"""
    return INTEGRATION_PERMISSIONS.get(provider.lower(), ["Access your account"])

