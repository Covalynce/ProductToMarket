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
        response = supabase.table("user_integrations").select("access_token").eq("user_id", user_id).eq("provider", provider).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]['access_token']
        return None
    except Exception as e:
        print(f"DB Error (Tokens): {e}")
        return None

def save_user_token(user_id: str, provider: str, token: str):
    if not supabase: return
    data = {"user_id": user_id, "provider": provider, "access_token": token}
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
    return profile.get('openai_key') if profile else None

def save_user_settings(user_id: str, openai_key: str):
    if not supabase: return
    supabase.table("user_settings").update({"openai_key": openai_key}).eq("user_id", user_id).execute()

def get_cached_cards(user_id: str, limit: int = 10):
    if not supabase: return []
    try:
        return supabase.table("task_cards").select("*").eq("user_id", user_id).eq("status", "PENDING").order("created_at", desc=True).limit(limit).execute().data
    except: return []

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