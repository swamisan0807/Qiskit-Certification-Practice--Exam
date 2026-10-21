-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- One row per submitted exam. Row-level security means each signed-in user
-- can only insert and read their own rows.

create table if not exists public.attempts (
  id               bigint generated always as identity primary key,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at       timestamptz not null default now(),
  score            integer not null,
  total            integer not null,
  time_up          boolean not null default false,
  duration_seconds integer,
  sections         jsonb not null default '{}'::jsonb
);

alter table public.attempts enable row level security;

drop policy if exists "Users read their own attempts" on public.attempts;
create policy "Users read their own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

drop policy if exists "Users add their own attempts" on public.attempts;
create policy "Users add their own attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);

create index if not exists attempts_user_created_idx
  on public.attempts (user_id, created_at desc);
