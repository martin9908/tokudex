-- TokuDex — episodes.episode_type
-- ---------------------------------------------------------------------------
-- Tags an episode as something other than a normal story episode: a clip show,
-- a filler episode, a recap, a special, or a crossover. NULL (the default and
-- the overwhelmingly common case) means "regular canon episode".
--
-- Deliberately NOT a progress-affecting field: `episode_number` still counts
-- every episode as it aired, so `user_series_progress.current_episode` and the
-- progress bar keep their existing meaning. The tag is presentation only — the
-- episode list badges it and offers a "hide filler" toggle.
--
-- Text + CHECK rather than a Postgres enum: adding a new kind later is a plain
-- constraint swap, no `alter type` dance, and PostgREST returns it as a string.
--
-- Idempotent: safe to re-run.
-- ---------------------------------------------------------------------------

alter table public.episodes
  add column if not exists episode_type text;

alter table public.episodes
  drop constraint if exists episodes_episode_type_check;

alter table public.episodes
  add constraint episodes_episode_type_check
  check (
    episode_type is null
    or episode_type in ('filler', 'clip_show', 'recap', 'special', 'crossover')
  );

comment on column public.episodes.episode_type is
  'Optional tag: filler | clip_show | recap | special | crossover. NULL = regular canon episode. Presentation only — does not affect progress math.';

-- Partial index: the "hide filler" toggle and any future "tagged episodes"
-- lookups only ever care about the small minority of rows that are tagged.
create index if not exists episodes_episode_type_idx
  on public.episodes (series_id, episode_type)
  where episode_type is not null;

-- No RLS change needed — `episodes` is already public-read and client-write is
-- not granted, so the tag is seeded via the service role / dashboard like the
-- rest of the catalog.
