-- TokuDex — catalog seed (idempotent)
-- ---------------------------------------------------------------------------
-- Runs on `supabase db reset`, or apply manually in the SQL editor. Safe to run
-- repeatedly: series are inserted only if a row with the same title doesn't
-- already exist, and episodes upsert on (series_id, episode_number).
--
-- IMPORTANT — content honesty:
--   * `episodes.synopsis` is the "what happened in this episode" recap the app
--     surfaces — it is the product's whole differentiator. Source it from a
--     reliable place (official guides, Fandom, Wikipedia) and verify it.
--   * Episode counts / air years below should be confirmed before relying on
--     them. Only well-established facts are filled in; the rest are left NULL.
--   * Do NOT ship machine-invented plot summaries as if they were canonical.
-- ---------------------------------------------------------------------------

-- Series ---------------------------------------------------------------------
-- Pattern: insert only when a series of that title isn't already present.

insert into public.series (title, franchise, total_episodes, original_run, synopsis)
select
  'Kamen Rider Kuuga',
  'Kamen Rider',
  49,
  '2000-2001',
  'Yusuke Godai becomes Kamen Rider Kuuga and battles the ancient Gurongi tribe.'
where not exists (select 1 from public.series where title = 'Kamen Rider Kuuga');

-- Add more series with the same guard. Leave total_episodes / original_run NULL
-- when you have not verified them rather than guessing.
--
-- insert into public.series (title, franchise, total_episodes, original_run, synopsis)
-- select '<Title>', '<Franchise>', <count-or-null>, '<years-or-null>', '<series synopsis>'
-- where not exists (select 1 from public.series where title = '<Title>');


-- Episodes -------------------------------------------------------------------
-- Pattern: resolve series_id by title, upsert by (series_id, episode_number).
-- Replace the placeholder synopsis with a real, sourced recap before shipping.
--
-- insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
-- select s.id, 1, 'Episode 1 title', 'Sourced recap of what happens in episode 1.', '2000-01-30'
-- from public.series s
-- where s.title = 'Kamen Rider Kuuga'
-- on conflict (series_id, episode_number)
-- do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
--
-- For bulk loads, generate one such statement per episode (a small script that
-- reads a CSV of episode_number,title,synopsis,air_date is the easy path —
-- ask and we can add one).
