-- =============================================
-- Whispr – Full database setup v5
-- Run this in your Supabase SQL Editor
-- =============================================

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text default '',
  type text not null default 'ideas',
  categories text[] default array['General'],
  poll_options text[] default array[]::text[],
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
  poll_choice text default '',
  reactions jsonb not null default '{}',
  created_at timestamptz default now()
);

alter table sessions enable row level security;
alter table responses enable row level security;

create policy "Public read sessions"   on sessions for select using (true);
create policy "Public insert sessions" on sessions for insert with check (true);
create policy "Owner update sessions"  on sessions for update using (auth.uid() = user_id);
create policy "Owner delete sessions"  on sessions for delete using (auth.uid() = user_id);

create policy "Public read responses"    on responses for select using (true);
create policy "Public insert responses"  on responses for insert with check (true);
create policy "Public update responses"  on responses for update using (true);
create policy "Public delete responses"  on responses for delete using (true);

-- =============================================
-- Already have tables? Run just these:
-- =============================================
-- alter table sessions add column if not exists poll_options text[] default array[]::text[];
-- alter table responses add column if not exists poll_choice text default '';

-- =============================================
-- Chat messages table (for Catch Up sessions)
-- =============================================
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  anon_id text not null,
  anon_name text not null,
  anon_color text not null default '#7c6ff7',
  text text not null,
  reply_to uuid references chat_messages(id) on delete set null,
  reply_preview text default '',
  reply_name text default '',
  reactions jsonb not null default '{}',
  reactor_ids jsonb not null default '{}',
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;

create policy "Public read chat"   on chat_messages for select using (true);
create policy "Public insert chat" on chat_messages for insert with check (true);
create policy "Public update chat" on chat_messages for update using (true);
create policy "Public delete chat" on chat_messages for delete using (true);

-- Enable realtime for chat_messages
alter publication supabase_realtime add table chat_messages;

-- If sessions table already exists, add the catchup type (no migration needed
-- since type is a text field — just start creating sessions with type='catchup')

-- =============================================
-- v13 additions — run these if upgrading
-- =============================================
-- alter table sessions add column if not exists survey_questions jsonb default '[]';
-- alter table responses add column if not exists survey_answers jsonb default '{}';
-- alter table chat_messages add column if not exists is_pinned boolean default false;
