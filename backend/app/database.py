import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def get_user_token(user_id: str, provider: str) -> str | None:
    if not supabase: return None
    try:
        from app.encryption import decrypt_token
        response = supabase.table("user_integrations").select("access_token").eq("user_id", user_id).eq("provider", provider).execute()
        if response.data and len(response.data) > 0:
            encrypted_token = response.data[0]['access_token']
            return decrypt_token(encrypted_token)
        return None
    except Exception as e:
        print(f"DB Error (Tokens): {e}")
        return None

def save_user_token(user_id: str, provider: str, token: str):
    if not supabase: return
    from app.encryption import encrypt_token
    encrypted_token = encrypt_token(token)
    data = {"user_id": user_id, "provider": provider, "access_token": encrypted_token}
    supabase.table("user_integrations").upsert(data).execute()
    supabase.table("user_settings").upsert({"user_id": user_id}, on_conflict="user_id").execute()

def get_user_profile(user_id: str):
    if not supabase: return None
    try:
        res = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()
        if res.data: return res.data[0]
        default_profile = {"user_id": user_id, "plan": "SOLO", "cards_used": 0, "card_limit": 5}
        supabase.table("user_settings").insert(default_profile).execute()
        return default_profile
    except: return None

def upgrade_user_plan(user_id: str, plan: str = "PRO"):
    if not supabase: return
    supabase.table("user_settings").update({"plan": plan, "card_limit": 9999}).eq("user_id", user_id).execute()

def increment_usage(user_id: str):
    if not supabase: return
    try:
        current = get_user_profile(user_id)
        new_count = (current.get('cards_used', 0) or 0) + 1
        supabase.table("user_settings").update({"cards_used": new_count}).eq("user_id", user_id).execute()
    except: pass

def check_limit_reached(user_id: str) -> bool:
    profile = get_user_profile(user_id)
    if not profile: return False
    return profile['cards_used'] >= profile['card_limit']

def get_user_openai_key(user_id: str) -> str | None:
    profile = get_user_profile(user_id)
    if not profile or not profile.get('openai_key'):
        return None
    from app.encryption import decrypt_token
    encrypted_key = profile.get('openai_key')
    return decrypt_token(encrypted_key)

def save_user_settings(user_id: str, openai_key: str):
    if not supabase: return
    from app.encryption import encrypt_token
    encrypted_key = encrypt_token(openai_key) if openai_key else None
    supabase.table("user_settings").update({"openai_key": encrypted_key}).eq("user_id", user_id).execute()

def get_cached_cards(user_id: str, limit: int = 10):
    if not supabase: return []
    try:
        return supabase.table("task_cards").select("*").eq("user_id", user_id).eq("status", "PENDING").order("created_at", desc=True).limit(limit).execute().data
    except: return []

def get_card_history(user_id: str, limit: int = 50, offset: int = 0):
    """Get all cards (including POSTED and DISMISSED) for history view"""
    if not supabase: return []
    try:
        return supabase.table("task_cards").select("*").eq("user_id", user_id).in_("status", ["PENDING", "POSTED", "DISMISSED"]).order("created_at", desc=True).limit(limit).offset(offset).execute().data
    except Exception as e:
        print(f"DB Error (Card History): {e}")
        return []

def card_exists(user_id: str, source_id: str):
    if not supabase: return False
    try:
        return len(supabase.table("task_cards").select("id").eq("user_id", user_id).eq("source_id", source_id).execute().data) > 0
    except: return False

def save_card(user_id: str, card_data: dict):
    if not supabase: return
    card_data["user_id"] = user_id
    try: 
        supabase.table("task_cards").insert(card_data).execute()
        increment_usage(user_id) 
    except Exception as e: print(f"DB Error: {e}")

def update_card_status(card_id: str, status: str):
    if not supabase: return
    try: supabase.table("task_cards").update({"status": status}).eq("id", card_id).execute()
    except: pass

def get_user_integrations(user_id: str):
    """Get all integrations for a user with permissions"""
    if not supabase: return []
    try:
        return supabase.table("user_integrations").select("*").eq("user_id", user_id).execute().data
    except: return []

def save_integration_with_permissions(user_id: str, provider: str, token: str, refresh_token: str = None, permissions: list = None, consent_given: bool = True):
    """Save integration with permissions and consent tracking"""
    if not supabase: return
    from app.encryption import encrypt_token
    data = {
        "user_id": user_id,
        "provider": provider,
        "access_token": encrypt_token(token),
        "consent_given": consent_given,
        "consent_timestamp": "now()" if consent_given else None
    }
    if refresh_token:
        data["refresh_token"] = encrypt_token(refresh_token)
    if permissions:
        data["permissions"] = permissions
    supabase.table("user_integrations").upsert(data).execute()
    supabase.table("user_settings").upsert({"user_id": user_id}, on_conflict="user_id").execute()

def get_integration_refresh_token(user_id: str, provider: str) -> str | None:
    """Get refresh token for an integration"""
    if not supabase: return None
    try:
        from app.encryption import decrypt_token
        response = supabase.table("user_integrations").select("refresh_token").eq("user_id", user_id).eq("provider", provider).execute()
        if response.data and len(response.data) > 0:
            encrypted_refresh = response.data[0].get('refresh_token')
            return decrypt_token(encrypted_refresh) if encrypted_refresh else None
        return None
    except: return None

def update_integration_token(user_id: str, provider: str, access_token: str, refresh_token: str = None):
    """Update access token and optionally refresh token"""
    if not supabase: return
    from app.encryption import encrypt_token
    data = {"access_token": encrypt_token(access_token)}
    if refresh_token:
        data["refresh_token"] = encrypt_token(refresh_token)
    supabase.table("user_integrations").update(data).eq("user_id", user_id).eq("provider", provider).execute()

def save_analytics(user_id: str, card_id: str, platform: str, post_id: str = None, status: str = "PENDING"):
    """Save post analytics"""
    if not supabase: return
    data = {
        "user_id": user_id,
        "card_id": card_id,
        "platform": platform,
        "status": status
    }
    if post_id:
        data["post_id"] = post_id
    if status == "POSTED":
        data["posted_at"] = "now()"
    try:
        supabase.table("post_analytics").insert(data).execute()
    except Exception as e:
        print(f"Analytics save error: {e}")

def update_card_image(card_id: str, image_url: str, generated: bool = False):
    """Update card with image URL"""
    if not supabase: return
    supabase.table("task_cards").update({"image_url": image_url, "image_generated": generated}).eq("id", card_id).execute()

def add_webhook_retry(user_id: str, provider: str, endpoint: str, payload: dict, max_retries: int = 3):
    """Add webhook to retry queue"""
    if not supabase: return
    import json
    from datetime import datetime, timedelta
    data = {
        "user_id": user_id,
        "provider": provider,
        "endpoint": endpoint,
        "payload": payload,
        "max_retries": max_retries,
        "status": "PENDING",
        "next_retry_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    }
    try:
        supabase.table("webhook_retries").insert(data).execute()
    except Exception as e:
        print(f"Webhook retry save error: {e}")

def get_pending_webhook_retries():
    """Get webhooks ready for retry"""
    if not supabase: return []
    from datetime import datetime
    try:
        return supabase.table("webhook_retries").select("*").eq("status", "PENDING").lte("next_retry_at", datetime.utcnow().isoformat()).execute().data
    except: return []

def update_webhook_retry_status(retry_id: str, status: str, error_message: str = None, increment_retry: bool = False):
    """Update webhook retry status"""
    if not supabase: return
    from datetime import datetime, timedelta
    data = {"status": status, "last_attempt_at": datetime.utcnow().isoformat()}
    if error_message:
        data["error_message"] = error_message
    if increment_retry:
        # Get current retry count and increment
        retry = supabase.table("webhook_retries").select("retry_count, max_retries").eq("id", retry_id).execute()
        if retry.data:
            new_count = retry.data[0].get("retry_count", 0) + 1
            data["retry_count"] = new_count
            if new_count < retry.data[0].get("max_retries", 3):
                data["next_retry_at"] = (datetime.utcnow() + timedelta(minutes=5 * new_count)).isoformat()
                data["status"] = "PENDING"
    supabase.table("webhook_retries").update(data).eq("id", retry_id).execute()

def save_payment_notification(user_id: str, payment_id: str, amount: float, currency: str, status: str, failure_reason: str = None):
    """Save payment notification"""
    if not supabase: return
    data = {
        "user_id": user_id,
        "payment_id": payment_id,
        "amount": amount,
        "currency": currency,
        "status": status
    }
    if failure_reason:
        data["failure_reason"] = failure_reason
    try:
        supabase.table("payment_notifications").insert(data).execute()
    except Exception as e:
        print(f"Payment notification save error: {e}")

def get_ai_usage_today(user_id: str) -> int:
    """Get AI usage count for today"""
    if not supabase: return 0
    from datetime import datetime, timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    try:
        count = supabase.table("ai_usage_log").select("id", count="exact").eq("user_id", user_id).gte("created_at", today_start).execute()
        return count.count if hasattr(count, 'count') else 0
    except: return 0

def get_ai_usage_month(user_id: str) -> int:
    """Get AI usage count for current month"""
    if not supabase: return 0
    from datetime import datetime
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    try:
        count = supabase.table("ai_usage_log").select("id", count="exact").eq("user_id", user_id).gte("created_at", month_start).execute()
        return count.count if hasattr(count, 'count') else 0
    except: return 0

def log_ai_usage(user_id: str, model: str, tokens_used: int = 0):
    """Log AI usage for billing"""
    if not supabase: return
    data = {
        "user_id": user_id,
        "model": model,
        "tokens_used": tokens_used
    }
    try:
        supabase.table("ai_usage_log").insert(data).execute()
    except Exception as e:
        print(f"AI usage log error: {e}")

def get_user_ai_preferences(user_id: str):
    """Get user AI preferences"""
    if not supabase: return None
    try:
        result = supabase.table("ai_preferences").select("*").eq("user_id", user_id).execute()
        return result.data[0] if result.data else None
    except: return None

def save_user_ai_preferences(user_id: str, preferences: dict):
    """Save user AI preferences"""
    if not supabase: return
    preferences["user_id"] = user_id
    try:
        supabase.table("ai_preferences").upsert(preferences).execute()
    except Exception as e:
        print(f"Save AI preferences error: {e}")

def learn_from_interaction(user_id: str, action: str, content: str, feedback: str = None):
    """Log user interaction for AI learning"""
    if not supabase: return
    data = {
        "user_id": user_id,
        "action": action,  # approve, edit, discard, etc.
        "content": content,
        "feedback": feedback
    }
    try:
        supabase.table("ai_learning_log").insert(data).execute()
    except Exception as e:
        print(f"AI learning log error: {e}")

def create_notification(user_id: str, type: str, title: str, message: str, severity: str = "info", action_url: str = None, metadata: dict = None):
    """Create a notification for a user"""
    if not supabase: return
    data = {
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "severity": severity,
        "read": False
    }
    if action_url:
        data["action_url"] = action_url
    if metadata:
        data["metadata"] = metadata
    try:
        supabase.table("notifications").insert(data).execute()
    except Exception as e:
        print(f"Notification creation error: {e}")

def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get notifications for a user"""
    if not supabase: return []
    try:
        query = supabase.table("notifications").select("*").eq("user_id", user_id)
        if unread_only:
            query = query.eq("read", False)
        return query.order("created_at", desc=True).limit(limit).execute().data
    except: return []

def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    if not supabase: return
    try:
        supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    except Exception as e:
        print(f"Mark notification read error: {e}")

def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    if not supabase: return
    try:
        supabase.table("notifications").update({"read": True}).eq("user_id", user_id).eq("read", False).execute()
    except Exception as e:
        print(f"Mark all notifications read error: {e}")

def get_unread_count(user_id: str) -> int:
    """Get count of unread notifications"""
    if not supabase: return 0
    try:
        result = supabase.table("notifications").select("id", count="exact").eq("user_id", user_id).eq("read", False).execute()
        return result.count if hasattr(result, 'count') else 0
    except: return 0