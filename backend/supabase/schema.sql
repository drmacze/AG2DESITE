-- AG2 developer-console production session backend.
-- Raw ContentLog/profiler/diagnostics files stay local; only summaries are stored remotely.
create extension if not exists pgcrypto;

create table if not exists public.ag2_debug_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  build text,
  device text,
  minecraft_version text,
  artifact_summary jsonb not null default '[]'::jsonb,
  contentlog_summary jsonb,
  profile_summary jsonb,
  diagnostics_summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ag2_debug_sessions_user_created_idx
  on public.ag2_debug_sessions(user_id, created_at desc);

alter table public.ag2_debug_sessions enable row level security;

-- Remove broad default grants first. The browser may only SELECT/INSERT/DELETE
-- and RLS limits every operation to auth.uid() = user_id.
revoke all privileges on table public.ag2_debug_sessions from anon;
revoke all privileges on table public.ag2_debug_sessions from authenticated;
grant select, insert, delete on table public.ag2_debug_sessions to authenticated;

drop policy if exists "debug sessions select own" on public.ag2_debug_sessions;
drop policy if exists "ag2_debug_sessions_select_own" on public.ag2_debug_sessions;
create policy "ag2_debug_sessions_select_own"
  on public.ag2_debug_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "debug sessions insert own" on public.ag2_debug_sessions;
drop policy if exists "ag2_debug_sessions_insert_own" on public.ag2_debug_sessions;
create policy "ag2_debug_sessions_insert_own"
  on public.ag2_debug_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "debug sessions delete own" on public.ag2_debug_sessions;
drop policy if exists "ag2_debug_sessions_delete_own" on public.ag2_debug_sessions;
create policy "ag2_debug_sessions_delete_own"
  on public.ag2_debug_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);
