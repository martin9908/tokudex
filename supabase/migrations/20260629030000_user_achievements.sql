-- TokuDex — user_achievements
-- ---------------------------------------------------------------------------
-- Durable record of which achievements a user has earned, and when. The "is it
-- earned" logic still computes live from progress; this table adds permanence
-- (earned_at timestamps, cross-device history, future leaderboards). Synced
-- from the server actions after each progress change.
--
-- Idempotent: safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists public.user_achievements (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  constraint user_achievements_pkey primary key (id),
  constraint user_achievements_user_key_unique unique (user_id, achievement_key),
  constraint user_achievements_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

alter table public.user_achievements enable row level security;

-- Owner-only: a user can read and insert their own earned rows. No update/delete
-- needed (achievements are permanent; account deletion cascades).
drop policy if exists "user_achievements_select_own" on public.user_achievements;
create policy "user_achievements_select_own"
  on public.user_achievements
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_achievements_insert_own" on public.user_achievements;
create policy "user_achievements_insert_own"
  on public.user_achievements
  for insert
  with check (auth.uid() = user_id);
