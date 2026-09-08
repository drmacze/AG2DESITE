-- Optional AG2 developer-console session backend.
-- Safe-by-default: users can only access their own rows.
create extension if not exists pgcrypto;

create table if not exists public.ag2_debug_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  build text,
  device text,
  minecraft_version text,
  artifact_summary jsonb not null default '{}'::jsonb,
  contentlog_summary jsonb,
  profile_summary jsonb,
  diagnostics_summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ag2_debug_sessions_user_created_idx
  on public.ag2_debug_sessions(user_id, created_at desc);

alter table public.ag2_debug_sessions enable row level security;

drop policy if exists "debug sessions select own" on public.ag2_debug_sessions;
create policy "debug sessions select own"
  on public.ag2_debug_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "debug sessions insert own" on public.ag2_debug_sessions;
create policy "debug sessions insert own"
  on public.ag2_debug_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "debug sessions delete own" on public.ag2_debug_sessions;
create policy "debug sessions delete own"
  on public.ag2_debug_sessions for delete
  using (auth.uid() = user_id);
