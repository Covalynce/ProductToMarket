-- Notifications Table
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  type text not null, -- payment_failure, integration_error, ai_limit, orchestration_success, etc.
  title text not null,
  message text not null,
  severity text default 'info', -- info, warning, error, success
  read boolean default false,
  action_url text, -- Optional URL to related page
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table notifications enable row level security;
create policy "Users can view own notifications" on notifications for all using (true);

-- Indexes
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_read on notifications(read);
create index if not exists idx_notifications_created on notifications(created_at desc);

