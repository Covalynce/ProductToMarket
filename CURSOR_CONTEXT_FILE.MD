Covalynce Platform: Master Architecture & Context

1. Project Mission

Covalynce is a "Silent Orchestration Layer" for technical founders. It connects Engineering tools (GitHub, Jira) to Marketing channels (LinkedIn, Twitter) to eliminate the lag between shipping code and announcing value.

Core Philosophy:

Zero Input: The user should not have to "manage" the tool. It watches silently.

Click, Click, Done: The user only reviews drafts. They never write from scratch.

Obsidian Aesthetic: Dark, neon, precision UI.

2. Tech Stack

Frontend (The Face)

Framework: Next.js 14 (App Router)

Styling: Tailwind CSS

Theme: Custom "Obsidian" palette (#0B0C10, #1F2833, #66FCF1).

Icons: Lucide React

Animations: Framer Motion (for physics-based card swiping)

State: Local React State (MVP) -> Moving to SWR/React Query.

Backend (The Brain)

Framework: FastAPI (Python)

Networking: httpx (Async HTTP client)

Validation: Pydantic Models

Server: Uvicorn

Database (The Vault)

Provider: Supabase (PostgreSQL)

Security: Row Level Security (RLS) enabled.

Key Tables: user_settings, user_integrations, task_cards.

AI Engine

Model: OpenAI GPT-4o-mini (Cost-efficient, high speed).

Function: Translates technical commit messages into marketing copy.

Mode: BYOK (Bring Your Own Key) supported.

3. Architecture & Data Flow

The "Sync Loop" (Backend)

Trigger: Frontend calls GET /sync/github.

Auth Check: Backend verifies x-user-id header against Supabase.

Token Fetch: Backend retrieves the user's specific GitHub OAuth token from user_integrations.

Poll: Backend calls GitHub API for PushEvent or ReleaseEvent.

Deduplication: Checks task_cards table to ensure this event hasn't been processed.

AI Generation: If new, sends diff/commit message to OpenAI to generate "Sassy" marketing copy.

Cache: Saves the result to task_cards with status PENDING.

Return: Returns list of pending cards to Frontend.

The "Action Loop" (Frontend)

Review: User sees a stack of cards (Marketing, Engineering, Strategy).

Edit: User clicks "Edit" to modify AI text (Local State).

Execute: User swipes "Approve".

Frontend calls POST /action/approve.

Backend retrieves LinkedIn Token.

Backend posts to LinkedIn API.

Backend updates card status to APPROVED in DB.

4. Database Schema (Reference)

-- Users & Settings
create table user_settings (
  user_id text primary key,
  openai_key text,
  plan text default 'SOLO',
  cards_used int default 0,
  card_limit int default 5
);

-- OAuth Tokens (Critical Security)
create table user_integrations (
  user_id text not null,
  provider text not null, -- 'github', 'linkedin', 'slack'
  access_token text not null,
  unique(user_id, provider)
);

-- The Work Items
create table task_cards (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  source_id text not null, -- GitHub Event ID
  category text, -- 'MKT', 'ENG'
  content text, -- The AI Draft
  status text default 'PENDING', -- 'PENDING', 'APPROVED', 'DISMISSED'
  unique(user_id, source_id)
);


5. Current Implementation Status

✅ Completed

[x] Next.js Boilerplate: With Tailwind & Custom Fonts.

[x] FastAPI Backend: With CORS & Environment Config.

[x] Auth: GitHub OAuth implementation (Backend callback + Frontend redirect).

[x] Database: Supabase connection helper (database.py) & Schema.

[x] Sync Logic: GitHub Polling + OpenAI Draft Generation.

[x] UI: Glassmorphism Dashboard with Framer Motion animations.

[x] Demo Mode: Pre-seeded dummy accounts for instant testing.

🚧 In Progress / Next Steps

[ ] Real LinkedIn Posting: Currently mocked or requires specific API permission tier.

[ ] Stripe/Razorpay Webhooks: Handling actual payment events (currently client-side simulation).

[ ] Slack Bot: Incoming webhook integration for "Engineering" alerts.

6. Coding Standards for AI (Cursor)

When generating code for this project, follow these rules:

Zero Trust Security: NEVER hardcode API keys. Always use os.getenv or fetch from DB.

Defensive Coding: Always use .get() when parsing JSON from external APIs (GitHub/LinkedIn) to prevent KeyError.

Async/Await: All I/O operations (DB, API calls) must be async.

Tailwind Classes: Use the custom colors bg-obsidian, bg-gunmetal, text-neon instead of raw hex values.

Type Safety: Use Pydantic models for all Backend request/response bodies.

7. How to Run

Backend:

cd backend
source venv/bin/activate
uvicorn app.main:app --reload


Frontend:

cd frontend
npm run dev


Access:
Frontend: http://localhost:3000
Backend Docs: http://localhost:8000/docs