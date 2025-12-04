-- Database Schema Updates for Enhanced Features

-- 1. User Accounts Table (for email/password auth)
create table if not exists user_accounts (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  user_id text unique not null, -- Links to user_settings.user_id
  email_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add AI preferences to user_settings
alter table user_settings add column if not exists ai_preferences jsonb default '{"tone":"professional","length":"medium","include_hashtags":true,"include_emojis":false}';

-- 2. Integration Permissions Tracking
alter table user_integrations add column if not exists permissions text[] default '{}';
alter table user_integrations add column if not exists consent_given boolean default false;
alter table user_integrations add column if not exists consent_timestamp timestamp with time zone;

-- 3. Analytics Tracking
create table if not exists post_analytics (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  card_id uuid references task_cards(id),
  platform text not null,
  post_id text,
  status text default 'PENDING', -- PENDING, POSTED, FAILED
  engagement_metrics jsonb default '{}',
  posted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Image Support for Task Cards
alter table task_cards add column if not exists image_url text;
alter table task_cards add column if not exists image_generated boolean default false;

-- 5. Webhook Retry Queue
create table if not exists webhook_retries (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  provider text not null,
  endpoint text not null,
  payload jsonb not null,
  retry_count int default 0,
  max_retries int default 3,
  status text default 'PENDING', -- PENDING, SUCCESS, FAILED
  last_attempt_at timestamp with time zone,
  next_retry_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Payment Notifications
create table if not exists payment_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  payment_id text,
  amount decimal,
  currency text default 'INR',
  status text not null, -- SUCCESS, FAILED, PENDING
  failure_reason text,
  notified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. RLS Policies for new tables
alter table user_accounts enable row level security;
alter table post_analytics enable row level security;
alter table webhook_retries enable row level security;
alter table payment_notifications enable row level security;

create policy "Public Access" on user_accounts for all using (true);
create policy "Public Access" on post_analytics for all using (true);
create policy "Public Access" on webhook_retries for all using (true);
create policy "Public Access" on payment_notifications for all using (true);

-- 9. Competitors Tracking
create table if not exists competitors (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  platform text not null,
  handle text not null,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. AI Training Data
create table if not exists ai_training (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  content text,
  style text not null,
  examples text[],
  style_prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Competitor Posts Cache
create table if not exists competitor_posts (
  id uuid default gen_random_uuid() primary key,
  competitor_id uuid references competitors(id),
  user_id text not null,
  platform text not null,
  content text,
  engagement_metrics jsonb,
  posted_at timestamp with time zone,
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. RLS Policies for new tables
alter table competitors enable row level security;
alter table ai_training enable row level security;
alter table competitor_posts enable row level security;

create policy "Public Access" on competitors for all using (true);
create policy "Public Access" on ai_training for all using (true);
create policy "Public Access" on competitor_posts for all using (true);

-- 8. Indexes for performance
create index if not exists idx_user_accounts_email on user_accounts(email);
create index if not exists idx_user_accounts_user_id on user_accounts(user_id);
create index if not exists idx_post_analytics_user_id on post_analytics(user_id);
create index if not exists idx_post_analytics_card_id on post_analytics(card_id);
create index if not exists idx_webhook_retries_status on webhook_retries(status);
create index if not exists idx_webhook_retries_next_retry on webhook_retries(next_retry_at);
create index if not exists idx_payment_notifications_user_id on payment_notifications(user_id);
create index if not exists idx_competitors_user_id on competitors(user_id);
create index if not exists idx_ai_training_user_id on ai_training(user_id);
create index if not exists idx_competitor_posts_competitor_id on competitor_posts(competitor_id);

-- 13. AI Usage Log
create table if not exists ai_usage_log (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  model text not null,
  tokens_used int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. AI Preferences
create table if not exists ai_preferences (
  user_id text primary key,
  tone text default 'professional',
  style text default 'engaging',
  length text default 'medium',
  include_hashtags boolean default true,
  include_emojis boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. AI Learning Log
create table if not exists ai_learning_log (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  action text not null,
  content text,
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. User AI Limits
alter table user_settings add column if not exists daily_ai_limit int default 50;
alter table user_settings add column if not exists monthly_ai_limit int default 1000;

-- 17. RLS and Indexes
alter table ai_usage_log enable row level security;
alter table ai_preferences enable row level security;
alter table ai_learning_log enable row level security;

create policy "Public Access" on ai_usage_log for all using (true);
create policy "Public Access" on ai_preferences for all using (true);
create policy "Public Access" on ai_learning_log for all using (true);

create index if not exists idx_ai_usage_user_date on ai_usage_log(user_id, created_at);
create index if not exists idx_ai_learning_user_action on ai_learning_log(user_id, action);

