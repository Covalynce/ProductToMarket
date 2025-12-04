"""
Encryption utilities for sensitive data
"""
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Generate encryption key from environment variable or create one
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # In production, this should be set via environment variable
    # For development, generate a key (but warn)
    import warnings
    warnings.warn("ENCRYPTION_KEY not set - using generated key (not secure for production)")
    ENCRYPTION_KEY = Fernet.generate_key().decode()

def get_cipher():
    """Get Fernet cipher instance"""
    # If key is not base64, derive it
    try:
        key_bytes = base64.urlsafe_b64decode(ENCRYPTION_KEY.encode())
        if len(key_bytes) != 32:
            raise ValueError("Invalid key length")
        return Fernet(base64.urlsafe_b64encode(key_bytes))
    except:
        # Derive key from password if needed
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'covalynce_salt',  # In production, use random salt stored securely
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
        return Fernet(key)

def encrypt_token(token: str) -> str:
    """Encrypt a token before storage"""
    if not token:
        return ""
    try:
        cipher = get_cipher()
        encrypted = cipher.encrypt(token.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    except Exception as e:
        # Log error but don't fail - allows graceful degradation
        import logging
        logging.error(f"Encryption error: {e}")
        return token  # Return unencrypted as fallback

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a token after retrieval"""
    if not encrypted_token:
        return ""
    try:
        cipher = get_cipher()
        decoded = base64.urlsafe_b64decode(encrypted_token.encode())
        decrypted = cipher.decrypt(decoded)
        return decrypted.decode()
    except Exception as e:
        # If decryption fails, might be unencrypted (migration scenario)
        import logging
        logging.warning(f"Decryption error (might be unencrypted): {e}")
        return encrypted_token  # Return as-is if decryption fails

