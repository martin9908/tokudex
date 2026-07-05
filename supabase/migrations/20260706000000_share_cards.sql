-- TokuDex — share_cards
-- ---------------------------------------------------------------------------
-- Immutable, public snapshots of a moment a user chose to share (a rank,
-- milestone, franchise trophy, series completion, or overall stats). Public
-- /share/[slug] pages and their OG images read ONLY from this table, never from
-- the private progress tables — so nothing beyond what the owner published is
-- ever exposed. One row per (user, share_key), reused on repeat shares.
--
-- Idempotent: safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists public.share_cards (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  user_id uuid not null,
  share_key text not null,
  kind text not null,
  title text not null,
  subtitle text,
  stat_label text,
  stat_value text,
  display_name text,
  created_at timestamptz not null default now(),
  constraint share_cards_pkey primary key (id),
  constraint share_cards_slug_unique unique (slug),
  constraint share_cards_user_key_unique unique (user_id, share_key),
  constraint share_cards_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

alter table public.share_cards enable row level security;

-- Public read: share cards are meant to be opened by anyone with the link, and
-- hold only the snapshot the owner explicitly published (no live private data).
drop policy if exists "share_cards_select_public" on public.share_cards;
create policy "share_cards_select_public"
  on public.share_cards
  for select
  using (true);

-- Owner-only insert; a user can only mint cards for themselves.
drop policy if exists "share_cards_insert_own" on public.share_cards;
create policy "share_cards_insert_own"
  on public.share_cards
  for insert
  with check (auth.uid() = user_id);
