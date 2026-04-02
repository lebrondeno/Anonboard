-- =============================================
-- Whispr – Full database setup
-- Run this in your Supabase SQL Editor
-- =============================================

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text default '',
  type text not null default 'ideas',
  categories text[] default array['General'],
  admin_token uuid not null default gen_random_uuid(),
  allow_reactions boolean default true,
  allow_replies boolean default false,
  cover_image text default '',
  created_at timestamptz default now()
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  text text not null,
  category text not null default 'General',
  reactions jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Row Level Security
alter table sessions enable row level security;
alter table responses enable row level security;

-- Sessions: anyone can read and create
create policy "Public read sessions"    on sessions for select using (true);
create policy "Public insert sessions"  on sessions for insert with check (true);

-- Sessions: only owner can update/delete
create policy "Owner update sessions"   on sessions for update using (auth.uid() = user_id);
create policy "Owner delete sessions"   on sessions for delete using (auth.uid() = user_id);

-- Responses: fully public (anonymous submissions)
create policy "Public read responses"    on responses for select using (true);
create policy "Public insert responses"  on responses for insert with check (true);
create policy "Public update responses"  on responses for update using (true);
create policy "Public delete responses"  on responses for delete using (true);

-- =============================================
-- If you already ran a previous version, run
-- these ALTER statements instead of the above:
-- =============================================
-- alter table sessions add column if not exists user_id uuid references auth.users(id) on delete set null;
-- alter table sessions add column if not exists cover_image text default '';
-- alter table sessions add column if not exists description text default '';
-- alter table sessions add column if not exists type text default 'ideas';
-- alter table sessions add column if not exists allow_reactions boolean default true;
-- alter table sessions add column if not exists allow_replies boolean default false;
