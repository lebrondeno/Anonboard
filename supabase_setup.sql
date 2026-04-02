-- Run this in your Supabase SQL Editor

create table sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  type text not null default 'ideas',
  categories text[] default array['General'],
  admin_token uuid not null default gen_random_uuid(),
  allow_reactions boolean default true,
  allow_replies boolean default false,
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

alter table sessions enable row level security;
alter table responses enable row level security;

create policy "Public read sessions"   on sessions for select using (true);
create policy "Public insert sessions" on sessions for insert with check (true);
create policy "Public read responses"  on responses for select using (true);
create policy "Public insert responses" on responses for insert with check (true);
create policy "Public update responses" on responses for update using (true);
create policy "Public delete responses" on responses for delete using (true);
