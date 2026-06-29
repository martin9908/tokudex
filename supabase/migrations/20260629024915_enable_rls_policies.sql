-- TokuDex — Row Level Security policies
-- ---------------------------------------------------------------------------
-- Migration applied via `supabase db push`. Idempotent (drop-if-exists +
-- create), so it is safe to re-run and safe to re-apply on a reset.
--
-- Model:
--   * series, episodes        -> public catalog, readable by anyone, no writes
--                                from clients (seed via service role / dashboard).
--   * user_series_progress    -> each row is private to its owner (user_id).
--   * episode_notes           -> each row is private to its owner (user_id).
--
-- WHY THIS MATTERS: the Supabase anon key ships to the browser. Without RLS,
-- any visitor can read/write EVERY user's progress and notes directly through
-- the REST API, bypassing the Next.js API routes entirely. RLS is the only
-- thing that actually enforces per-user isolation.
-- ---------------------------------------------------------------------------

-- Enable RLS on every table -------------------------------------------------
alter table public.series                enable row level security;
alter table public.episodes              enable row level security;
alter table public.user_series_progress  enable row level security;
alter table public.episode_notes         enable row level security;

-- series: public read -------------------------------------------------------
drop policy if exists "series_public_read" on public.series;
create policy "series_public_read"
  on public.series
  for select
  using (true);

-- episodes: public read -----------------------------------------------------
drop policy if exists "episodes_public_read" on public.episodes;
create policy "episodes_public_read"
  on public.episodes
  for select
  using (true);

-- user_series_progress: owner-only full access ------------------------------
drop policy if exists "progress_select_own" on public.user_series_progress;
create policy "progress_select_own"
  on public.user_series_progress
  for select
  using (auth.uid() = user_id);

drop policy if exists "progress_insert_own" on public.user_series_progress;
create policy "progress_insert_own"
  on public.user_series_progress
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "progress_update_own" on public.user_series_progress;
create policy "progress_update_own"
  on public.user_series_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "progress_delete_own" on public.user_series_progress;
create policy "progress_delete_own"
  on public.user_series_progress
  for delete
  using (auth.uid() = user_id);

-- episode_notes: owner-only full access -------------------------------------
drop policy if exists "notes_select_own" on public.episode_notes;
create policy "notes_select_own"
  on public.episode_notes
  for select
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.episode_notes;
create policy "notes_insert_own"
  on public.episode_notes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.episode_notes;
create policy "notes_update_own"
  on public.episode_notes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.episode_notes;
create policy "notes_delete_own"
  on public.episode_notes
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Verify (run after applying):
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in
--       ('series','episodes','user_series_progress','episode_notes');
--   -- rowsecurity must be true for all four.
--
--   select tablename, policyname, cmd
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
--   -- expect the 10 policies created above.
-- ---------------------------------------------------------------------------
