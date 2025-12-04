import os
import httpx
import logging
import razorpay
import hmac
import hashlib
import json
import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Header, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from dotenv import load_dotenv
from openai import OpenAI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import (
    get_user_token, save_user_token, get_cached_cards, save_card, 
    card_exists, update_card_status, get_user_openai_key, 
    save_user_settings, check_limit_reached, get_user_profile, upgrade_user_plan,
    get_user_integrations, save_integration_with_permissions, get_integration_refresh_token,
    update_integration_token, save_analytics, update_card_image, add_webhook_retry,
    get_pending_webhook_retries, update_webhook_retry_status, save_payment_notification,
    get_ai_usage_today, get_ai_usage_month, log_ai_usage, get_user_ai_preferences,
    save_user_ai_preferences, learn_from_interaction, create_notification, get_notifications,
    mark_notification_read, mark_all_notifications_read, get_unread_count, get_card_history
)
from app.auth import (
    verify_password, get_password_hash, create_access_token, verify_token,
    get_permissions_for_provider, INTEGRATION_PERMISSIONS
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CovalynceSaaS")

load_dotenv()

# --- CONFIGURATION ---
# We use .get() here to prevent crashing if keys are missing during dev
GLOBAL_OPENAI_KEY = os.getenv("OPENAI_API_KEY")
CLIENT_ID_GITHUB = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET_GITHUB = os.getenv("GITHUB_CLIENT_SECRET")
CLIENT_ID_LINKEDIN = os.getenv("LINKEDIN_CLIENT_ID")
CLIENT_SECRET_LINKEDIN = os.getenv("LINKEDIN_CLIENT_SECRET")
CLIENT_ID_GOOGLE = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET_GOOGLE = os.getenv("GOOGLE_CLIENT_SECRET")
CLIENT_ID_FACEBOOK = os.getenv("FACEBOOK_CLIENT_ID")
CLIENT_SECRET_FACEBOOK = os.getenv("FACEBOOK_CLIENT_SECRET")
CLIENT_ID_TWITTER = os.getenv("TWITTER_CLIENT_ID")
CLIENT_SECRET_TWITTER = os.getenv("TWITTER_CLIENT_SECRET")
NANO_BANANA_API_KEY = os.getenv("NANO_BANANA_API_KEY")
GROK_API_KEY = os.getenv("GROK_API_KEY")
XAI_API_KEY = os.getenv("XAI_API_KEY")  # xAI Grok API
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

# Initialize OpenAI only if key exists, otherwise we handle it gracefully later
client = OpenAI(api_key=GLOBAL_OPENAI_KEY) if GLOBAL_OPENAI_KEY else None

app = FastAPI(title="Covalynce API")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - In production, replace "*" with specific origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class TaskCard(BaseModel):
    id: str
    source_id: str
    category: str
    type: str
    title: str
    subtitle: str
    content: str
    tags: List[str]
    timestamp: str
    colorClass: str

class SettingsPayload(BaseModel):
    openai_key: str

class AuthPayload(BaseModel):
    code: str
    user_id: str
    redirect_uri: Optional[str] = None

class ActionPayload(BaseModel):
    id: str
    content: str
    platform: str

class SlackNotifyPayload(BaseModel):
    card_id: str

class SignUpPayload(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

class SignInPayload(BaseModel):
    email: EmailStr
    password: str

class IntegrationConsentPayload(BaseModel):
    provider: str
    permissions: List[str]
    consent_given: bool

class ImageGeneratePayload(BaseModel):
    prompt: str
    card_id: Optional[str] = None

class CardUpdatePayload(BaseModel):
    content: str
    image_url: Optional[str] = None

class CompetitorPayload(BaseModel):
    name: str
    platform: str
    handle: str
    url: Optional[str] = None

class AITrainingPayload(BaseModel):
    content: str
    style: str
    examples: List[str]

class MemeEditPayload(BaseModel):
    template_id: str
    top_text: str
    bottom_text: str

class MultiSourcePayload(BaseModel):
    sources: List[dict]
    combine_strategy: str = "merge"

class TrendingLocationPayload(BaseModel):
    location: str
    platform: Optional[str] = None
    category: Optional[str] = None

class AIPreferencePayload(BaseModel):
    tone: str  # professional, casual, sassy, hinglish, etc.
    style: str
    length: str  # short, medium, long
    include_hashtags: bool = True
    include_emojis: bool = False

class PostEditPayload(BaseModel):
    original_content: str
    original_image_url: Optional[str] = None
    edits: dict
    use_grok: bool = False 

class PaymentOrder(BaseModel):
    amount: int
    currency: str = "INR"

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class WebhookPayload(BaseModel):
    event: str
    payload: dict

# --- AI ENGINE ---
def run_ai_agent(user_id: str, system_prompt: str, user_content: str):
    user_key = get_user_openai_key(user_id)
    # Fallback to global key if user hasn't provided one
    key_to_use = user_key if user_key else GLOBAL_OPENAI_KEY
    
    if not key_to_use: 
        return "AI Not Configured (Add Key in Settings)"
    
    # Create a temporary client for this request
    temp_client = OpenAI(api_key=key_to_use)
    try:
        response = temp_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}],
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"AI Error: {str(e)}"

def generate_marketing_copy(repo_name: str, commit_msg: str) -> str:
    if not client: 
        return f"Updates to {repo_name}: {commit_msg}"
        
    prompt = f"Write a professional LinkedIn post about code pushed to '{repo_name}' with message: '{commit_msg}'. Under 200 chars. Use 'We'."
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except:
        return f"Updates to {repo_name}: {commit_msg}"

# --- ENDPOINTS ---

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 COVALYNCE PLATFORM ENGINE ONLINE")
    # Start background webhook retry task
    asyncio.create_task(process_webhook_retries())

@app.get("/")
def read_root(): return {"status": "online", "mode": "SAAS PRO"}

@app.get("/user/profile")
async def get_profile(x_user_id: str = Header(None)):
    if not x_user_id: raise HTTPException(status_code=401)
    return get_user_profile(x_user_id)

@app.post("/payment/order")
@limiter.limit("10/minute")
async def create_order(request: Request, payload: PaymentOrder, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401)
    if not RAZORPAY_KEY_ID: 
        raise HTTPException(status_code=500, detail="Razorpay Config Missing")
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    data = { 
        "amount": payload.amount, 
        "currency": payload.currency, 
        "receipt": f"receipt_{x_user_id}_{datetime.utcnow().timestamp()}" 
    }
    try:
        order = client.order.create(data=data)
        return order
    except Exception as e:
        logger.error(f"Razorpay order creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/payment/verify")
@limiter.limit("10/minute")
async def verify_payment(request: Request, payload: PaymentVerify, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401)
    if not RAZORPAY_KEY_ID:
        raise HTTPException(status_code=500, detail="Razorpay Config Missing")
    
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        })
        upgrade_user_plan(x_user_id, "PRO")
        # Create success notification
        create_notification(
            x_user_id,
            "payment_success",
            "Plan Upgraded",
            "Your plan has been upgraded to PRO successfully!",
            "success"
        )
        return {"status": "verified", "plan": "PRO"}
    except razorpay.errors.SignatureVerificationError as e:
        logger.error(f"Payment verification failed: {e}")
        # Create failure notification
        create_notification(
            x_user_id,
            "payment_failure",
            "Payment Verification Failed",
            "Payment could not be verified. Please contact support.",
            "error"
        )
        raise HTTPException(status_code=400, detail="Payment Verification Failed")
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/settings/update")
async def update_settings(payload: SettingsPayload, x_user_id: str = Header(None)):
    if not x_user_id: raise HTTPException(status_code=401)
    save_user_settings(x_user_id, payload.openai_key)
    return {"status": "updated"}

@app.post("/auth/github/callback")
async def github_auth(payload: AuthPayload):
    token_url = "https://github.com/login/oauth/access_token"
    data = { "client_id": CLIENT_ID_GITHUB, "client_secret": CLIENT_SECRET_GITHUB, "code": payload.code }
    async with httpx.AsyncClient() as http:
        try:
            resp = await http.post(token_url, json=data, headers={"Accept": "application/json"})
            token_data = resp.json()
            if "access_token" not in token_data: raise HTTPException(status_code=400)
            save_user_token(payload.user_id, "github", token_data["access_token"])
            return {"status": "connected", "provider": "github"}
        except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/linkedin/callback")
async def linkedin_auth(payload: AuthPayload):
    if not CLIENT_ID_LINKEDIN or not CLIENT_SECRET_LINKEDIN:
        # Fallback to simulated token if LinkedIn credentials not configured
        fake_token = "li_simulated_token_" + payload.code
        save_user_token(payload.user_id, "linkedin", fake_token)
        return {"status": "connected", "provider": "linkedin", "note": "Using simulated token - configure LinkedIn credentials for production"}
    
    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    redirect_uri = payload.redirect_uri or "http://localhost:3000/auth/linkedin/callback"
    
    data = {
        "grant_type": "authorization_code",
        "code": payload.code,
        "redirect_uri": redirect_uri,
        "client_id": CLIENT_ID_LINKEDIN,
        "client_secret": CLIENT_SECRET_LINKEDIN
    }
    
    async with httpx.AsyncClient() as http:
        try:
            resp = await http.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            token_data = resp.json()
            
            if "access_token" not in token_data:
                logger.error(f"LinkedIn OAuth error: {token_data}")
                raise HTTPException(status_code=400, detail="Failed to get LinkedIn access token")
            
            access_token = token_data["access_token"]
            
            # Get user's LinkedIn URN for posting
            profile_headers = {"Authorization": f"Bearer {access_token}"}
            profile_resp = await http.get("https://api.linkedin.com/v2/userinfo", headers=profile_headers)
            profile_data = profile_resp.json() if profile_resp.status_code == 200 else {}
            
            # Store token with metadata
            save_user_token(payload.user_id, "linkedin", access_token)
            if profile_data.get("sub"):
                # Store LinkedIn URN in metadata if available
                from app.database import supabase
                if supabase:
                    try:
                        supabase.table("user_integrations").update({
                            "metadata": {"person_urn": f"urn:li:person:{profile_data['sub']}"}
                        }).eq("user_id", payload.user_id).eq("provider", "linkedin").execute()
                    except Exception as e:
                        logger.warning(f"Could not save LinkedIn metadata: {e}")
            
            return {"status": "connected", "provider": "linkedin"}
        except Exception as e:
            logger.error(f"LinkedIn auth error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/slack/callback")
async def slack_auth(payload: AuthPayload):
    fake_token = "xoxb_simulated_token_" + payload.code
    save_user_token(payload.user_id, "slack", fake_token)
    return {"status": "connected", "provider": "slack"}

@app.get("/cards/history")
async def get_history(x_user_id: str = Header(None), limit: int = Query(50, le=100), offset: int = Query(0, ge=0)):
    """Get card history (all cards including POSTED and DISMISSED)"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    cards = get_card_history(x_user_id, limit=limit, offset=offset)
    return {"cards": cards}

@app.get("/sync/github", response_model=List[TaskCard])
async def sync_all_sources(x_user_id: str = Header(None)):
    if not x_user_id: return []
    
    cached = get_cached_cards(x_user_id)
    if cached: 
        return [TaskCard(id=str(r['id']), source_id=r['source_id'], category=r['category'], type=r['type'], title=r['title'], subtitle=r['subtitle'], content=r['content'], tags=r['tags'], timestamp=r['created_at'], colorClass=r['color_class']) for r in cached]

    if check_limit_reached(x_user_id):
        return [TaskCard(id="limit", source_id="sys_limit", category="ENG", type="SYSTEM", title="Usage Limit Reached", subtitle="Upgrade to PRO", content="You have used your 5 free cards. Upgrade to PRO to continue syncing.", tags=["Billing"], timestamp="Now", colorClass="bg-red-900 text-white")]

    token = get_user_token(x_user_id, "github")
    if not token:
        return [TaskCard(id="setup", category="ENG", type="SYSTEM", title="Connect GitHub", subtitle="Required", content="Please connect GitHub to see commits.", tags=["Setup"], timestamp="Now", colorClass="bg-red-900")]

    # --- DEMO MODE BYPASS ---
    if token.startswith("ghp_demo"):
        new_cards = []
        if not card_exists(x_user_id, "demo_1"):
            demo1 = {"source_id": "demo_1", "category": "MKT", "type": "GITHUB", "title": "Shipped: auth-service", "subtitle": "Ready to Publish", "content": "🚀 Just shipped the new Auth Service with 0ms latency. #Scale", "tags": ["#ShipIt"], "color_class": "bg-gray-800 text-white"}
            save_card(x_user_id, demo1)
            new_cards.append(demo1)
        if not card_exists(x_user_id, "demo_2"):
            demo2 = {"source_id": "demo_2", "category": "ENG", "type": "JIRA", "title": "Sprint 42", "subtitle": "Completed", "content": "Sprint 42 is wrapped. 15 tickets closed. Velocity up 20%.", "tags": ["#Agile"], "color_class": "bg-purple-900 text-white"}
            save_card(x_user_id, demo2)
            new_cards.append(demo2)
        
        cached = get_cached_cards(x_user_id)
        return [TaskCard(id=str(r['id']), source_id=r['source_id'], category=r['category'], type=r['type'], title=r['title'], subtitle=r['subtitle'], content=r['content'], tags=r['tags'], timestamp=r['created_at'], colorClass=r['color_class']) for r in cached]
    # ------------------------

    headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}
    
    async with httpx.AsyncClient() as http:
        try:
            user = await http.get("https://api.github.com/user", headers=headers)
            username = user.json()["login"]
            events = await http.get(f"https://api.github.com/users/{username}/events/public", headers=headers)
            event_data = events.json()
        except: return []

    cards = []
    for e in event_data[:5]:
        if e.get("type") == "PushEvent":
            eid = str(e["id"])
            if card_exists(x_user_id, eid): continue
            
            repo = e.get("repo", {}).get("name", "Repo")
            commits = e.get("payload", {}).get("commits", [])
            if not commits: continue
            
            msg = commits[0].get("message", "Update")
            copy = generate_marketing_copy(repo, msg)
            
            card_dict = {"source_id": eid, "category": "MKT", "type": "GITHUB", "title": f"Shipped: {repo.split('/')[-1]}", "subtitle": "Ready to Publish", "content": copy, "tags": ["#ShipIt"], "color_class": "bg-gray-800 text-white"}
            save_card(x_user_id, card_dict)
            cards.append(TaskCard(id="new", timestamp="Now", **{k:v for k,v in card_dict.items() if k != "color_class"}, colorClass=card_dict["color_class"]))
            
    if cards:
        cached = get_cached_cards(x_user_id)
        return [TaskCard(id=str(r['id']), source_id=r['source_id'], category=r['category'], type=r['type'], title=r['title'], subtitle=r['subtitle'], content=r['content'], tags=r['tags'], timestamp=r['created_at'], colorClass=r['color_class']) for r in cached]
    
    return []

async def get_linkedin_person_urn(user_id: str) -> Optional[str]:
    """Get LinkedIn person URN from database metadata"""
    from app.database import supabase
    if not supabase:
        return None
    try:
        result = supabase.table("user_integrations").select("metadata").eq("user_id", user_id).eq("provider", "linkedin").execute()
        if result.data and result.data[0].get("metadata"):
            return result.data[0]["metadata"].get("person_urn")
    except Exception as e:
        logger.warning(f"Could not fetch LinkedIn URN: {e}")
    return None

async def post_to_linkedin(access_token: str, content: str, user_id: str) -> dict:
    """Post content to LinkedIn using UGC Posts API"""
    person_urn = await get_linkedin_person_urn(user_id)
    
    if not person_urn:
        # Fallback: try to get person URN from userinfo endpoint
        async with httpx.AsyncClient() as http:
            try:
                profile_resp = await http.get(
                    "https://api.linkedin.com/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if profile_resp.status_code == 200:
                    profile_data = profile_resp.json()
                    if profile_data.get("sub"):
                        person_urn = f"urn:li:person:{profile_data['sub']}"
            except Exception as e:
                logger.error(f"Could not fetch LinkedIn profile: {e}")
    
    if not person_urn:
        raise HTTPException(status_code=400, detail="Could not determine LinkedIn person URN")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    
    post_data = {
        "author": person_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    async with httpx.AsyncClient() as http:
        try:
            resp = await http.post(
                "https://api.linkedin.com/v2/ugcPosts",
                headers=headers,
                json=post_data
            )
            
            if resp.status_code not in [200, 201]:
                error_detail = resp.text
                logger.error(f"LinkedIn API error: {resp.status_code} - {error_detail}")
                raise HTTPException(status_code=resp.status_code, detail=f"LinkedIn API error: {error_detail}")
            
            return resp.json()
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"LinkedIn posting error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to post to LinkedIn: {str(e)}")

@app.post("/action/execute")
async def execute_action(payload: ActionPayload, x_user_id: str = Header(None)):
    if not x_user_id: raise HTTPException(status_code=401)
    
    # Update card status first
    update_card_status(payload.id, "APPROVED")
    
    post_id = None
    status = "POSTED"
    
    # Post to platform if LinkedIn
    if payload.platform.upper() == "LINKEDIN":
        token = get_user_token(x_user_id, "linkedin")
        if not token:
            status = "FAILED"
            save_analytics(x_user_id, payload.id, "linkedin", None, status)
            raise HTTPException(status_code=400, detail="LinkedIn not connected")
        
        # Check if it's a simulated token
        if token.startswith("li_simulated_token_"):
            logger.info(f"Simulated LinkedIn post for card {payload.id}")
            save_analytics(x_user_id, payload.id, "linkedin", None, "PENDING")
            return {"status": "executed", "platform": payload.platform, "note": "Simulated - configure LinkedIn credentials for real posting"}
        
        try:
            result = await post_to_linkedin(token, payload.content, x_user_id)
            post_id = result.get("id")
            save_analytics(x_user_id, payload.id, "linkedin", post_id, "POSTED")
            return {"status": "executed", "platform": payload.platform, "linkedin_post_id": post_id}
        except HTTPException:
            status = "FAILED"
            save_analytics(x_user_id, payload.id, "linkedin", None, status)
            raise
        except Exception as e:
            logger.error(f"Failed to post to LinkedIn: {e}")
            status = "FAILED"
            save_analytics(x_user_id, payload.id, "linkedin", None, status)
            # Don't fail the action if posting fails, but log it
            return {"status": "executed", "platform": payload.platform, "warning": f"Posting failed: {str(e)}"}
    
    # Save analytics for other platforms too
    save_analytics(x_user_id, payload.id, payload.platform.lower(), post_id, status)
    
    return {"status": "executed", "platform": payload.platform}

@app.post("/action/discard")
async def discard_action(payload: ActionPayload, x_user_id: str = Header(None)):
    update_card_status(payload.id, "DISMISSED")
    return {"status": "dismissed"}

# --- WEBHOOK ENDPOINTS ---

# --- GITHUB WEBHOOK FOR ORCHESTRATION ---

@app.post("/webhook/github")
async def github_webhook(request: Request):
    """Handle GitHub webhooks for orchestration"""
    try:
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event")
        
        logger.info(f"GitHub webhook received: {event_type}")
        
        # Handle PR merge events
        if event_type == "pull_request" and payload.get("action") == "closed":
            pr = payload.get("pull_request", {})
            if pr.get("merged"):
                # Extract user_id from repository or webhook configuration
                # For now, we'll need to store webhook user mappings
                # This is a simplified version
                
                # Get repository owner (could be user or org)
                repo = payload.get("repository", {})
                owner = repo.get("owner", {}).get("login")
                
                # Find user_id by GitHub username (stored in metadata)
                from app.database import supabase
                if supabase:
                    # This is simplified - in production would have proper user-repo mapping
                    users = supabase.table("user_integrations").select("user_id").eq("provider", "github").execute().data
                    
                    for user_integration in users:
                        user_id = user_integration.get("user_id")
                        # Process orchestration for this user
                        result = await handle_pr_merge_to_prod(pr, user_id)
                        logger.info(f"Orchestration result for user {user_id}: {result}")
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"GitHub webhook error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events for payment verification"""
    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay webhook secret not configured")
    
    try:
        payload = await request.body()
        signature = request.headers.get("X-Razorpay-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing signature")
        
        # Verify webhook signature
        expected_signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        event_data = json.loads(payload)
        event_type = event_data.get("event")
        
        logger.info(f"Razorpay webhook received: {event_type}")
        
        # Handle payment success
        if event_type == "payment.captured":
            payment_data = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_data.get("order_id")
            payment_id = payment_data.get("id")
            amount = payment_data.get("amount", 0) / 100  # Convert from paise to rupees
            
            # Extract user_id from order receipt (format: receipt_{user_id})
            receipt = payment_data.get("notes", {}).get("user_id") or payment_data.get("order_id", "").split("_")[-1]
            
            if order_id and payment_id:
                # Verify payment with Razorpay
                client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
                try:
                    payment = client.payment.fetch(payment_id)
                    if payment.get("status") == "captured":
                        # Upgrade user plan
                        upgrade_user_plan(receipt, "PRO")
                        save_payment_notification(receipt, payment_id, amount, "INR", "SUCCESS")
                        logger.info(f"Upgraded user {receipt} to PRO plan")
                        return {"status": "success", "event": event_type}
                except Exception as e:
                    logger.error(f"Error verifying payment: {e}")
                    save_payment_notification(receipt, payment_id, amount, "INR", "FAILED", str(e))
                    raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")
        
        # Handle payment failures
        elif event_type == "payment.failed":
            payment_data = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            payment_id = payment_data.get("id")
            amount = payment_data.get("amount", 0) / 100
            failure_reason = payment_data.get("error_description", "Payment failed")
            receipt = payment_data.get("notes", {}).get("user_id") or "unknown"
            
            save_payment_notification(receipt, payment_id, amount, "INR", "FAILED", failure_reason)
            logger.warning(f"Payment failed for user {receipt}: {failure_reason}")
        
        # Handle subscription events
        elif event_type in ["subscription.activated", "subscription.charged"]:
            subscription_data = event_data.get("payload", {}).get("subscription", {}).get("entity", {})
            user_id = subscription_data.get("notes", {}).get("user_id")
            if user_id:
                upgrade_user_plan(user_id, "PRO")
                logger.info(f"Upgraded user {user_id} to PRO via subscription")
        
        return {"status": "success", "event": event_type}
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhook/slack")
async def slack_webhook(payload: dict):
    """Handle Slack incoming webhook for Engineering alerts"""
    if not SLACK_WEBHOOK_URL:
        raise HTTPException(status_code=500, detail="Slack webhook URL not configured")
    
    try:
        # Forward the payload to Slack
        async with httpx.AsyncClient() as http:
            resp = await http.post(SLACK_WEBHOOK_URL, json=payload)
            resp.raise_for_status()
            return {"status": "sent", "slack_response": resp.text}
    except Exception as e:
        logger.error(f"Slack webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- WEBHOOK RETRY BACKGROUND TASK ---

async def process_webhook_retries():
    """Background task to retry failed webhooks"""
    while True:
        try:
            pending = get_pending_webhook_retries()
            for retry in pending:
                try:
                    async with httpx.AsyncClient() as http:
                        resp = await http.post(
                            retry["endpoint"],
                            json=retry["payload"],
                            timeout=10.0
                        )
                        if resp.status_code < 400:
                            update_webhook_retry_status(retry["id"], "SUCCESS")
                        else:
                            update_webhook_retry_status(
                                retry["id"], "FAILED", resp.text, increment_retry=True
                            )
                except Exception as e:
                    update_webhook_retry_status(
                        retry["id"], "FAILED", str(e), increment_retry=True
                    )
        except Exception as e:
            logger.error(f"Webhook retry processing error: {e}")
        
        await asyncio.sleep(60)  # Check every minute

# Background task is started in startup_event()

@app.post("/action/slack/notify")
async def notify_slack_engineering(payload: SlackNotifyPayload, x_user_id: str = Header(None)):
    """Send an Engineering card notification to Slack"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    if not SLACK_WEBHOOK_URL:
        raise HTTPException(status_code=500, detail="Slack webhook not configured")
    
    # Get card details from database
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        card_result = supabase.table("task_cards").select("*").eq("id", payload.card_id).eq("user_id", x_user_id).execute()
        if not card_result.data:
            raise HTTPException(status_code=404, detail="Card not found")
        
        card = card_result.data[0]
        
        # Format Slack message
        slack_payload = {
            "text": f"🔧 Engineering Update: {card.get('title', 'New Task')}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"🔧 {card.get('title', 'Engineering Task')}"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*{card.get('subtitle', '')}*\n\n{card.get('content', '')}"
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"Category: {card.get('category', 'ENG')} | Type: {card.get('type', 'TASK')}"
                        }
                    ]
                }
            ]
        }
        
        async with httpx.AsyncClient() as http:
            try:
                resp = await http.post(SLACK_WEBHOOK_URL, json=slack_payload, timeout=10.0)
                resp.raise_for_status()
                return {"status": "sent", "card_id": payload.card_id}
            except Exception as e:
                # Add to retry queue
                add_webhook_retry(x_user_id, "slack", SLACK_WEBHOOK_URL, slack_payload)
                logger.warning(f"Slack webhook failed, added to retry queue: {e}")
                raise HTTPException(status_code=500, detail=f"Slack notification failed: {str(e)}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Slack notification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/auth/signup")
@limiter.limit("5/minute")
async def signup(request: Request, payload: SignUpPayload):
    """Sign up with email and password"""
    from app.database import supabase
    import uuid
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if email already exists
    existing = supabase.table("user_accounts").select("email").eq("email", payload.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user_id
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # Hash password
    password_hash = get_password_hash(payload.password)
    
    # Create account
    supabase.table("user_accounts").insert({
        "email": payload.email,
        "password_hash": password_hash,
        "user_id": user_id
    }).execute()
    
    # Create user settings
    supabase.table("user_settings").insert({
        "user_id": user_id,
        "plan": "SOLO",
        "cards_used": 0,
        "card_limit": 5
    }).execute()
    
    # Create access token
    access_token = create_access_token({"sub": user_id, "email": payload.email})
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}

@app.post("/auth/signin")
@limiter.limit("10/minute")
async def signin(request: Request, payload: SignInPayload):
    """Sign in with email and password"""
    from app.database import supabase
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get user account
    account = supabase.table("user_accounts").select("*").eq("email", payload.email).execute()
    if not account.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    account_data = account.data[0]
    
    # Verify password
    if not verify_password(payload.password, account_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token({"sub": account_data["user_id"], "email": payload.email})
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": account_data["user_id"]}

@app.post("/auth/google/callback")
async def google_auth(payload: AuthPayload):
    """Handle Google OAuth callback"""
    if not CLIENT_ID_GOOGLE or not CLIENT_SECRET_GOOGLE:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = payload.redirect_uri or "http://localhost:3000/auth/google/callback"
    
    data = {
        "code": payload.code,
        "client_id": CLIENT_ID_GOOGLE,
        "client_secret": CLIENT_SECRET_GOOGLE,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as http:
        try:
            resp = await http.post(token_url, data=data)
            token_data = resp.json()
            
            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail="Failed to get Google access token")
            
            access_token = token_data["access_token"]
            refresh_token = token_data.get("refresh_token")
            
            # Get user info
            user_info_resp = await http.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = user_info_resp.json()
            
            permissions = get_permissions_for_provider("google")
            save_integration_with_permissions(
                payload.user_id, "google", access_token, refresh_token, permissions, True
            )
            
            return {"status": "connected", "provider": "google", "user_info": user_info}
        except Exception as e:
            logger.error(f"Google auth error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/facebook/callback")
async def facebook_auth(payload: AuthPayload):
    """Handle Facebook OAuth callback"""
    if not CLIENT_ID_FACEBOOK or not CLIENT_SECRET_FACEBOOK:
        raise HTTPException(status_code=500, detail="Facebook OAuth not configured")
    
    token_url = "https://graph.facebook.com/v18.0/oauth/access_token"
    redirect_uri = payload.redirect_uri or "http://localhost:3000/auth/facebook/callback"
    
    params = {
        "client_id": CLIENT_ID_FACEBOOK,
        "client_secret": CLIENT_SECRET_FACEBOOK,
        "code": payload.code,
        "redirect_uri": redirect_uri
    }
    
    async with httpx.AsyncClient() as http:
        try:
            resp = await http.get(token_url, params=params)
            token_data = resp.json()
            
            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail="Failed to get Facebook access token")
            
            access_token = token_data["access_token"]
            
            # Get user info
            user_info_resp = await http.get(
                "https://graph.facebook.com/me",
                params={"access_token": access_token, "fields": "id,name,email"}
            )
            user_info = user_info_resp.json()
            
            permissions = get_permissions_for_provider("facebook")
            save_integration_with_permissions(
                payload.user_id, "facebook", access_token, None, permissions, True
            )
            
            return {"status": "connected", "provider": "facebook", "user_info": user_info}
        except Exception as e:
            logger.error(f"Facebook auth error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# --- INTEGRATION MANAGEMENT ---

@app.get("/integrations/permissions/{provider}")
async def get_provider_permissions(provider: str):
    """Get permissions required for a provider"""
    permissions = get_permissions_for_provider(provider)
    return {"provider": provider, "permissions": permissions}

@app.get("/integrations/list")
async def list_integrations(x_user_id: str = Header(None)):
    """List all user integrations with permissions"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    integrations = get_user_integrations(x_user_id)
    return {"integrations": integrations}

@app.post("/integrations/consent")
async def save_integration_consent(payload: IntegrationConsentPayload, x_user_id: str = Header(None)):
    """Save integration consent with permissions"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    # This would typically be called after OAuth callback
    # For now, we'll update existing integration
    from app.database import supabase
    if supabase:
        supabase.table("user_integrations").update({
            "permissions": payload.permissions,
            "consent_given": payload.consent_given,
            "consent_timestamp": datetime.utcnow().isoformat() if payload.consent_given else None
        }).eq("user_id", x_user_id).eq("provider", payload.provider).execute()
    
    return {"status": "consent_saved", "provider": payload.provider}

# --- TOKEN REFRESH ---

@app.post("/integrations/{provider}/refresh")
async def refresh_integration_token(provider: str, x_user_id: str = Header(None)):
    """Refresh OAuth token for an integration"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    refresh_token = get_integration_refresh_token(x_user_id, provider)
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token available")
    
    if provider == "linkedin":
        # LinkedIn token refresh
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": CLIENT_ID_LINKEDIN,
            "client_secret": CLIENT_SECRET_LINKEDIN
        }
        
        async with httpx.AsyncClient() as http:
            try:
                resp = await http.post(token_url, data=data)
                token_data = resp.json()
                
                if "access_token" not in token_data:
                    raise HTTPException(status_code=400, detail="Token refresh failed")
                
                new_access_token = token_data["access_token"]
                new_refresh_token = token_data.get("refresh_token", refresh_token)
                
                update_integration_token(x_user_id, provider, new_access_token, new_refresh_token)
                return {"status": "refreshed", "provider": provider}
            except Exception as e:
                logger.error(f"Token refresh error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
    
    elif provider == "google":
        # Google token refresh
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": CLIENT_ID_GOOGLE,
            "client_secret": CLIENT_SECRET_GOOGLE,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as http:
            try:
                resp = await http.post(token_url, data=data)
                token_data = resp.json()
                
                if "access_token" not in token_data:
                    raise HTTPException(status_code=400, detail="Token refresh failed")
                
                new_access_token = token_data["access_token"]
                update_integration_token(x_user_id, provider, new_access_token, refresh_token)
                return {"status": "refreshed", "provider": provider}
            except Exception as e:
                logger.error(f"Token refresh error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
    
    raise HTTPException(status_code=400, detail="Provider not supported for refresh")

# --- IMAGE GENERATION ---

@app.post("/image/generate")
async def generate_image(payload: ImageGeneratePayload, x_user_id: str = Header(None)):
    """Generate image using Nano Banana or similar service"""
    if not NANO_BANANA_API_KEY:
        # Fallback to placeholder or error
        raise HTTPException(status_code=500, detail="Image generation not configured")
    
    # Nano Banana API integration
    # Note: Adjust API endpoint based on actual Nano Banana API
    api_url = "https://api.nanobanana.ai/v1/generate"  # Placeholder URL
    
    headers = {
        "Authorization": f"Bearer {NANO_BANANA_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "prompt": payload.prompt,
        "width": 1024,
        "height": 1024,
        "model": "stable-diffusion-xl"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as http:
        try:
            resp = await http.post(api_url, json=data, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Image generation failed")
            
            result = resp.json()
            image_url = result.get("image_url") or result.get("url")
            
            # If card_id provided, update card with image
            if payload.card_id and image_url:
                update_card_image(payload.card_id, image_url, generated=True)
            
            return {"image_url": image_url, "prompt": payload.prompt}
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Image generation timeout")
        except Exception as e:
            logger.error(f"Image generation error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# --- ANALYTICS ---

@app.get("/analytics/posts")
async def get_post_analytics(x_user_id: str = Header(None), limit: int = 50):
    """Get analytics for posted content"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        analytics = supabase.table("post_analytics").select("*").eq("user_id", x_user_id).order("created_at", desc=True).limit(limit).execute().data
        return {"analytics": analytics}
    except Exception as e:
        logger.error(f"Analytics fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- TRENDS & COMPETITOR TRACKING ---

@app.post("/trends/competitor/add")
async def add_competitor(payload: CompetitorPayload, x_user_id: str = Header(None)):
    """Add a competitor to track"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        competitor_data = {
            "user_id": x_user_id,
            "name": payload.name,
            "platform": payload.platform,
            "handle": payload.handle,
            "url": payload.url
        }
        result = supabase.table("competitors").insert(competitor_data).execute()
        return {"status": "added", "competitor": result.data[0] if result.data else None}
    except Exception as e:
        logger.error(f"Add competitor error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trends/competitors")
async def get_competitors(x_user_id: str = Header(None)):
    """Get all tracked competitors"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        return {"competitors": []}
    
    try:
        competitors = supabase.table("competitors").select("*").eq("user_id", x_user_id).execute().data
        return {"competitors": competitors or []}
    except Exception as e:
        logger.error(f"Get competitors error: {e}")
        return {"competitors": []}

@app.get("/trends/competitor/{competitor_id}/posts")
async def get_competitor_posts(competitor_id: str, x_user_id: str = Header(None)):
    """Get posts from a competitor"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        return {"posts": []}
    
    try:
        competitor = supabase.table("competitors").select("*").eq("id", competitor_id).eq("user_id", x_user_id).execute()
        if not competitor.data:
            raise HTTPException(status_code=404, detail="Competitor not found")
        
        comp = competitor.data[0]
        # In production, this would fetch from the platform API
        # For now, return mock data
        return {
            "posts": [
                {
                    "id": "1",
                    "content": "Sample post from competitor",
                    "engagement": {"likes": 100, "comments": 20, "shares": 10},
                    "posted_at": "2024-01-15T10:00:00Z"
                }
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get competitor posts error: {e}")
        return {"posts": []}

@app.post("/trends/competitor/learn")
async def learn_from_competitor(competitor_id: str, x_user_id: str = Header(None)):
    """Learn from competitor posts - AI self-improvement"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Get competitor posts
        posts = supabase.table("competitor_posts").select("*").eq("competitor_id", competitor_id).limit(10).execute().data
        
        # Analyze posts and learn patterns
        # In production, this would use ML to extract style patterns
        learn_from_interaction(x_user_id, "competitor_analysis", str(posts), "learning_from_competitor")
        
        return {"status": "learned", "posts_analyzed": len(posts)}
    except Exception as e:
        logger.error(f"Competitor learning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trends/ai/styles")
async def get_ai_styles(x_user_id: str = Header(None)):
    """Get all trained AI styles"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        return {"styles": []}
    
    try:
        styles = supabase.table("ai_training").select("*").eq("user_id", x_user_id).execute().data
        return {"styles": styles or []}
    except Exception as e:
        logger.error(f"Get AI styles error: {e}")
        return {"styles": []}

@app.post("/trends/generate-comparison")
async def generate_comparison_post(competitor_post_id: str, x_user_id: str = Header(None)):
    """Generate a comparison post based on competitor content"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    user_key = get_user_openai_key(x_user_id)
    key_to_use = user_key if user_key else GLOBAL_OPENAI_KEY
    
    if not key_to_use:
        raise HTTPException(status_code=400, detail="OpenAI key not configured")
    
    # Get competitor post (mock for now)
    prompt = f"Create a comparison post that highlights our advantages over this competitor post. Be professional and engaging."
    
    try:
        client = OpenAI(api_key=key_to_use)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a marketing expert creating comparison content."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300
        )
        return {"content": response.choices[0].message.content.strip()}
    except Exception as e:
        logger.error(f"Comparison generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trends/trending")
async def get_trending_content(location: Optional[str] = Query(None), x_user_id: str = Header(None)):
    """Get trending content and memes for a location"""
    if not location:
        return {"trending": [], "memes": []}
    
    # In production, fetch from location-based APIs (Twitter Trends API, etc.)
    # Mock data for now
    trending = [
        {
            "id": "1",
            "type": "trend",
            "content": f"AI automation is trending in {location}",
            "hashtags": ["#AI", "#Automation"],
            "trending_score": 95,
            "category": "tech"
        },
        {
            "id": "2",
            "type": "trend",
            "content": f"Startup culture discussions in {location}",
            "hashtags": ["#Startup", "#Tech"],
            "trending_score": 88,
            "category": "business"
        }
    ]
    
    memes = [
        {
            "id": "1",
            "name": "Drake Pointing",
            "image_url": "https://via.placeholder.com/500x500?text=Drake+Meme",
            "template": "drake"
        },
        {
            "id": "2",
            "name": "Distracted Boyfriend",
            "image_url": "https://via.placeholder.com/500x500?text=Distracted",
            "template": "distracted"
        }
    ]
    
    return {"trending": trending, "memes": memes}

@app.post("/trends/meme/edit")
async def edit_meme(payload: MemeEditPayload, x_user_id: str = Header(None)):
    """Edit meme template with custom text"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    # In production, this would use an image editing API
    # For now, return a placeholder URL
    edited_url = f"https://via.placeholder.com/500x500?text={payload.top_text}+{payload.bottom_text}"
    
    return {
        "image_url": edited_url,
        "template_id": payload.template_id,
        "top_text": payload.top_text,
        "bottom_text": payload.bottom_text
    }

@app.post("/trends/post/edit")
async def edit_post_from_trend(payload: PostEditPayload, x_user_id: str = Header(None)):
    """Edit a post/image from trending content"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    # Check usage limits
    daily_usage = get_ai_usage_today(x_user_id)
    profile = get_user_profile(x_user_id)
    daily_limit = profile.get("daily_ai_limit", 50) if profile else 50
    
    if daily_usage >= daily_limit:
        raise HTTPException(status_code=429, detail=f"Daily AI limit reached ({daily_limit})")
    
    # Get user preferences
    preferences = get_user_ai_preferences(x_user_id)
    
    # Use Grok for Hinglish/sassy if requested
    if payload.use_grok and GROK_API_KEY:
        try:
            async with httpx.AsyncClient() as http:
                grok_response = await http.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROK_API_KEY}"},
                    json={
                        "model": "grok-beta",
                        "messages": [
                            {"role": "system", "content": "You are a sassy Hinglish content writer. Write catchy, engaging posts."},
                            {"role": "user", "content": f"Rewrite this: {payload.original_content}"}
                        ]
                    }
                )
                if grok_response.status_code == 200:
                    result = grok_response.json()
                    content = result["choices"][0]["message"]["content"]
                    log_ai_usage(x_user_id, "grok", 100)
                    learn_from_interaction(x_user_id, "post_edit", content, "grok_used")
                    return {"content": content, "image_url": payload.original_image_url, "model": "grok"}
        except Exception as e:
            logger.warning(f"Grok API error: {e}, falling back to OpenAI")
    
    # Fallback to OpenAI
    user_key = get_user_openai_key(x_user_id)
    key_to_use = user_key if user_key else GLOBAL_OPENAI_KEY
    
    if not key_to_use:
        raise HTTPException(status_code=400, detail="AI key not configured")
    
    # Build prompt based on preferences
    tone_instruction = f"Tone: {preferences.get('tone', 'professional')}" if preferences else ""
    style_instruction = f"Style: {preferences.get('style', 'engaging')}" if preferences else ""
    
    prompt = f"Edit this post: {payload.original_content}\n{tone_instruction}\n{style_instruction}\nEdits requested: {payload.edits}"
    
    try:
        client = OpenAI(api_key=key_to_use)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a content editor. Apply the requested edits while maintaining quality."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400
        )
        content = response.choices[0].message.content.strip()
        log_ai_usage(x_user_id, "gpt-4o-mini", 200)
        learn_from_interaction(x_user_id, "post_edit", content, "openai_used")
        return {"content": content, "image_url": payload.original_image_url, "model": "openai"}
    except Exception as e:
        logger.error(f"Post edit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trends/ai/preferences")
async def save_ai_preferences(payload: AIPreferencePayload, x_user_id: str = Header(None)):
    """Save AI preferences/filters"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    save_user_ai_preferences(x_user_id, payload.dict())
    return {"status": "saved", "preferences": payload.dict()}

@app.get("/trends/ai/preferences")
async def get_ai_preferences(x_user_id: str = Header(None)):
    """Get AI preferences"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    preferences = get_user_ai_preferences(x_user_id)
    return {"preferences": preferences or {}}

@app.get("/trends/usage")
async def get_ai_usage(x_user_id: str = Header(None)):
    """Get AI usage stats"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    daily = get_ai_usage_today(x_user_id)
    monthly = get_ai_usage_month(x_user_id)
    profile = get_user_profile(x_user_id)
    daily_limit = profile.get("daily_ai_limit", 50) if profile else 50
    monthly_limit = profile.get("monthly_ai_limit", 1000) if profile else 1000
    
    return {
        "daily": {"used": daily, "limit": daily_limit, "remaining": daily_limit - daily},
        "monthly": {"used": monthly, "limit": monthly_limit, "remaining": monthly_limit - monthly}
    }

@app.post("/trends/competitor/learn")
async def learn_from_competitor(competitor_id: str, x_user_id: str = Header(None)):
    """AI learns from competitor posts automatically"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Get competitor posts
        posts_result = supabase.table("competitor_posts").select("*").eq("competitor_id", payload.competitor_id).limit(10).execute()
        posts = posts_result.data if posts_result.data else []
        
        # Extract patterns and save to AI training
        for post in posts:
            training_data = {
                "user_id": x_user_id,
                "content": post.get("content", ""),
                "style": "competitor_learned",
                "examples": [post.get("content", "")]
            }
            supabase.table("ai_training").insert(training_data).execute()
        
        return {"status": "learned", "posts_analyzed": len(posts)}
    except Exception as e:
        logger.error(f"AI learning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trends/ai/preferences")
async def save_ai_preferences(preferences: dict, x_user_id: str = Header(None)):
    """Save AI preferences"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        return {"status": "saved"}
    
    try:
        # Store preferences in user_settings or separate table
        supabase.table("user_settings").update({"ai_preferences": preferences}).eq("user_id", x_user_id).execute()
        return {"status": "saved", "preferences": preferences}
    except Exception as e:
        logger.error(f"Save preferences error: {e}")
        return {"status": "saved"}

@app.get("/trends/ai/preferences")
async def get_ai_preferences(x_user_id: str = Header(None)):
    """Get AI preferences"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        return {"preferences": {"tone": "professional", "length": "medium", "include_hashtags": True, "include_emojis": False}}
    
    try:
        settings = supabase.table("user_settings").select("ai_preferences").eq("user_id", x_user_id).execute()
        if settings.data and settings.data[0].get("ai_preferences"):
            return {"preferences": settings.data[0]["ai_preferences"]}
    except:
        pass
    
    return {"preferences": {"tone": "professional", "length": "medium", "include_hashtags": True, "include_emojis": False}}

@app.get("/trends/usage")
async def get_usage_stats(x_user_id: str = Header(None)):
    """Get AI usage statistics"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    # In production, track actual usage
    return {
        "stats": {
            "daily": {"used": 0, "limit": 100},
            "monthly": {"used": 0, "limit": 2000}
        }
    }

@app.post("/integrations/{provider}/disable")
@limiter.limit("10/minute")
async def disable_integration(request: Request, provider: str, x_user_id: str = Header(None)):
    """Disable an integration"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        supabase.table("user_integrations").delete().eq("user_id", x_user_id).eq("provider", provider).execute()
        return {"status": "disabled", "provider": provider}
    except Exception as e:
        logger.error(f"Disable integration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- GDPR COMPLIANCE ---

@app.post("/user/data/export")
@limiter.limit("5/hour")
async def export_user_data(request: Request, x_user_id: str = Header(None)):
    """Export all user data (GDPR - Right to Data Portability)"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Collect all user data
        user_data = {
            "user_id": x_user_id,
            "exported_at": datetime.utcnow().isoformat(),
            "profile": None,
            "integrations": [],
            "cards": [],
            "analytics": [],
            "competitors": [],
            "ai_training": []
        }
        
        # Get profile
        profile = get_user_profile(x_user_id)
        if profile:
            # Don't export encrypted keys
            profile_copy = profile.copy()
            if 'openai_key' in profile_copy:
                profile_copy['openai_key'] = "[ENCRYPTED]"
            user_data["profile"] = profile_copy
        
        # Get integrations (without tokens)
        integrations = get_user_integrations(x_user_id)
        for integration in integrations:
            integration_copy = integration.copy()
            integration_copy['access_token'] = "[ENCRYPTED]"
            if 'refresh_token' in integration_copy:
                integration_copy['refresh_token'] = "[ENCRYPTED]"
            user_data["integrations"].append(integration_copy)
        
        # Get cards
        cards = supabase.table("task_cards").select("*").eq("user_id", x_user_id).execute().data
        user_data["cards"] = cards or []
        
        # Get analytics
        analytics = supabase.table("post_analytics").select("*").eq("user_id", x_user_id).execute().data
        user_data["analytics"] = analytics or []
        
        # Get competitors
        competitors = supabase.table("competitors").select("*").eq("user_id", x_user_id).execute().data
        user_data["competitors"] = competitors or []
        
        # Get AI training
        ai_training = supabase.table("ai_training").select("*").eq("user_id", x_user_id).execute().data
        user_data["ai_training"] = ai_training or []
        
        return user_data
    except Exception as e:
        logger.error(f"Data export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/user/data/delete")
@limiter.limit("1/hour")
async def delete_user_data(request: Request, x_user_id: str = Header(None)):
    """Delete all user data (GDPR - Right to be Forgotten)"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    from app.database import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Delete all user data
        supabase.table("task_cards").delete().eq("user_id", x_user_id).execute()
        supabase.table("post_analytics").delete().eq("user_id", x_user_id).execute()
        supabase.table("user_integrations").delete().eq("user_id", x_user_id).execute()
        supabase.table("competitors").delete().eq("user_id", x_user_id).execute()
        supabase.table("ai_training").delete().eq("user_id", x_user_id).execute()
        supabase.table("competitor_posts").delete().eq("user_id", x_user_id).execute()
        supabase.table("webhook_retries").delete().eq("user_id", x_user_id).execute()
        supabase.table("payment_notifications").delete().eq("user_id", x_user_id).execute()
        supabase.table("user_settings").delete().eq("user_id", x_user_id).execute()
        supabase.table("user_accounts").delete().eq("user_id", x_user_id).execute()
        
        return {"status": "deleted", "message": "All user data has been deleted"}
    except Exception as e:
        logger.error(f"Data deletion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ORCHESTRATION ENDPOINTS ---

@app.post("/orchestration/jira/check-stories")
@limiter.limit("10/minute")
async def check_story_completions(request: Request, x_user_id: str = Header(None)):
    """Check and update story completions based on PR merges"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    try:
        from app.orchestration import handle_multi_merge_story_completion
        results = await handle_multi_merge_story_completion(x_user_id)
        return {"status": "checked", "stories_checked": len(results), "results": results}
    except Exception as e:
        logger.error(f"Story completion check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orchestration/jira/link-pr")
@limiter.limit("20/minute")
async def link_pr_to_jira(request: Request, pr_number: int, repo: str, x_user_id: str = Header(None)):
    """Manually trigger Jira update for a PR"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    github_token = get_user_token(x_user_id, "github")
    if not github_token:
        raise HTTPException(status_code=400, detail="GitHub not connected")
    
    try:
        from app.orchestration import handle_pr_merge_to_prod
        async with httpx.AsyncClient() as http:
            headers = {"Authorization": f"token {github_token}", "Accept": "application/vnd.github.v3+json"}
            pr_resp = await http.get(f"https://api.github.com/repos/{repo}/pulls/{pr_number}", headers=headers)
            
            if pr_resp.status_code != 200:
                raise HTTPException(status_code=404, detail="PR not found")
            
            pr_data = pr_resp.json()
            result = await handle_pr_merge_to_prod(pr_data, x_user_id)
            return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Link PR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- NOTIFICATIONS ENDPOINTS ---

@app.get("/notifications")
@limiter.limit("30/minute")
async def get_user_notifications(request: Request, unread_only: bool = Query(False), x_user_id: str = Header(None)):
    """Get notifications for user"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    try:
        notifications = get_notifications(x_user_id, unread_only=unread_only)
        return {"notifications": notifications, "count": len(notifications)}
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        return {"notifications": [], "count": 0}

@app.get("/notifications/unread-count")
@limiter.limit("60/minute")
async def get_unread_notification_count(request: Request, x_user_id: str = Header(None)):
    """Get unread notification count"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    try:
        count = get_unread_count(x_user_id)
        return {"count": count}
    except Exception as e:
        logger.error(f"Get unread count error: {e}")
        return {"count": 0}

@app.post("/notifications/{notification_id}/read")
@limiter.limit("60/minute")
async def mark_notification_as_read(request: Request, notification_id: str, x_user_id: str = Header(None)):
    """Mark a notification as read"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    try:
        mark_notification_read(notification_id)
        return {"status": "read"}
    except Exception as e:
        logger.error(f"Mark notification read error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/notifications/read-all")
@limiter.limit("10/minute")
async def mark_all_as_read(request: Request, x_user_id: str = Header(None)):
    """Mark all notifications as read"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    try:
        mark_all_notifications_read(x_user_id)
        return {"status": "all_read"}
    except Exception as e:
        logger.error(f"Mark all read error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- AI REPHRASE ENDPOINT ---

class RephrasePayload(BaseModel):
    content: str
    tone: Optional[str] = "professional"
    length: Optional[str] = "medium"

@app.post("/ai/rephrase")
@limiter.limit("30/minute")
async def rephrase_content(request: Request, payload: RephrasePayload, x_user_id: str = Header(None)):
    """Rephrase content using AI"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    user_key = get_user_openai_key(x_user_id)
    key_to_use = user_key if user_key else GLOBAL_OPENAI_KEY
    
    if not key_to_use:
        raise HTTPException(status_code=400, detail="OpenAI key not configured")
    
    # Get user preferences
    preferences = get_user_ai_preferences(x_user_id)
    tone = payload.tone or (preferences.get('tone', 'professional') if preferences else 'professional')
    length = payload.length or (preferences.get('length', 'medium') if preferences else 'medium')
    
    # Map length to token count
    length_map = {
        'short': 100,
        'medium': 200,
        'long': 400
    }
    max_tokens = length_map.get(length, 200)
    
    try:
        client = OpenAI(api_key=key_to_use)
        prompt = f"Rephrase this content in a {tone} tone, keeping it {length} length:\n\n{payload.content}"
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"You are a content rephrasing expert. Maintain the original meaning while improving clarity and engagement. Tone: {tone}."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens
        )
        
        rephrased = response.choices[0].message.content.strip()
        log_ai_usage(x_user_id, "gpt-4o-mini", max_tokens)
        learn_from_interaction(x_user_id, "rephrase", payload.content, f"tone:{tone},length:{length}")
        
        return {"rephrased": rephrased}
    except Exception as e:
        logger.error(f"Rephrase error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trends/multi-source/combine")
async def combine_sources(payload: MultiSourcePayload, x_user_id: str = Header(None)):
    """Combine multiple sources into a single post"""
    if not x_user_id:
        raise HTTPException(status_code=401)
    
    # Check usage limits
    daily_usage = get_ai_usage_today(x_user_id)
    profile = get_user_profile(x_user_id)
    daily_limit = profile.get("daily_ai_limit", 50) if profile else 50
    
    if daily_usage >= daily_limit:
        raise HTTPException(status_code=429, detail=f"Daily AI limit reached ({daily_limit})")
    
    user_key = get_user_openai_key(x_user_id)
    key_to_use = user_key if user_key else GLOBAL_OPENAI_KEY
    
    if not key_to_use:
        raise HTTPException(status_code=400, detail="OpenAI key not configured")
    
    # Get preferences
    preferences = get_user_ai_preferences(x_user_id)
    
    # Combine sources based on strategy
    sources_text = "\n".join([f"Source {i+1}: {s.get('content', '')}" for i, s in enumerate(payload.sources)])
    
    tone = preferences.get('tone', 'professional') if preferences else 'professional'
    prompt = f"Combine these sources into a cohesive post ({tone} tone):\n{sources_text}\n\nStrategy: {payload.combine_strategy}"
    
    try:
        client = OpenAI(api_key=key_to_use)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a content curator combining multiple sources."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400
        )
        content = response.choices[0].message.content.strip()
        log_ai_usage(x_user_id, "gpt-4o-mini", 300)
        learn_from_interaction(x_user_id, "combine_sources", content, f"sources_count:{len(payload.sources)}")
        return {"content": content, "sources_used": len(payload.sources)}
    except Exception as e:
        logger.error(f"Multi-source combine error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENHANCED ACTION EXECUTE WITH ANALYTICS ---

# Update the existing execute_action to save analytics