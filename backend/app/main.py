import os
import httpx
import logging
import razorpay
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from openai import OpenAI
from app.database import (
    get_user_token, save_user_token, get_cached_cards, save_card, 
    card_exists, update_card_status, get_user_openai_key, 
    save_user_settings, check_limit_reached, get_user_profile, upgrade_user_plan
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CovalynceSaaS")

load_dotenv()

# --- CONFIGURATION ---
# We use .get() here to prevent crashing if keys are missing during dev
GLOBAL_OPENAI_KEY = os.getenv("OPENAI_API_KEY")
CLIENT_ID_GITHUB = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET_GITHUB = os.getenv("GITHUB_CLIENT_SECRET")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Initialize OpenAI only if key exists, otherwise we handle it gracefully later
client = OpenAI(api_key=GLOBAL_OPENAI_KEY) if GLOBAL_OPENAI_KEY else None

app = FastAPI(title="Covalynce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

class PaymentOrder(BaseModel):
    amount: int
    currency: str = "INR"

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

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
    logger.info("🚀 VECTAL SAAS ENGINE (MONETIZED + DEMO) ONLINE")

@app.get("/")
def read_root(): return {"status": "online", "mode": "SAAS PRO"}

@app.get("/user/profile")
async def get_profile(x_user_id: str = Header(None)):
    if not x_user_id: raise HTTPException(status_code=401)
    return get_user_profile(x_user_id)

@app.post("/payment/order")
async def create_order(payload: PaymentOrder, x_user_id: str = Header(None)):
    if not RAZORPAY_KEY_ID: raise HTTPException(status_code=500, detail="Razorpay Config Missing")
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    data = { "amount": payload.amount, "currency": payload.currency, "receipt": f"receipt_{x_user_id}" }
    return client.order.create(data=data)

@app.post("/payment/verify")
async def verify_payment(payload: PaymentVerify, x_user_id: str = Header(None)):
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        })
        upgrade_user_plan(x_user_id, "PRO")
        return {"status": "verified", "plan": "PRO"}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment Verification Failed")

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
    fake_token = "li_simulated_token_" + payload.code
    save_user_token(payload.user_id, "linkedin", fake_token)
    return {"status": "connected", "provider": "linkedin"}

@app.post("/auth/slack/callback")
async def slack_auth(payload: AuthPayload):
    fake_token = "xoxb_simulated_token_" + payload.code
    save_user_token(payload.user_id, "slack", fake_token)
    return {"status": "connected", "provider": "slack"}

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

@app.post("/action/execute")
async def execute_action(payload: ActionPayload, x_user_id: str = Header(None)):
    if not x_user_id: raise HTTPException(status_code=401)
    update_card_status(payload.id, "APPROVED")
    return {"status": "executed", "platform": payload.platform}

@app.post("/action/discard")
async def discard_action(payload: ActionPayload, x_user_id: str = Header(None)):
    update_card_status(payload.id, "DISMISSED")
    return {"status": "dismissed"}