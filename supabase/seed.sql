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

insert into public.series (title, franchise, total_episodes, original_run, synopsis)
select
  'Ultraman Omega',
  'Ultraman',
  25,
  '2025-2026',
  'Ultraman Omega falls to Earth as an amnesiac, adopting the human alias Sorato Okida. He integrates into human society while fighting monsters as Ultraman Omega, guided by subconscious instinct despite his predicament.'
where not exists (select 1 from public.series where title = 'Ultraman Omega');

-- Ongoing series — total_episodes left NULL until the run is confirmed.
insert into public.series (title, franchise, total_episodes, original_run, synopsis)
select
  'Ultraman Teo',
  'Ultraman',
  null,
  '2026',
  null
where not exists (select 1 from public.series where title = 'Ultraman Teo');

-- NOTE: Super Space Sheriff Gavan Infinity is seeded via episode upserts below.
-- The series row must already exist in the database under the title
-- 'Super Space Sheriff Gavan Infinity'. If your existing row uses a different
-- title, rename it first:
--   UPDATE public.series SET title = 'Super Space Sheriff Gavan Infinity',
--     total_episodes = 21 WHERE title = '<your current title>';
-- Then run the episode upserts below to add episodes 13–21.

insert into public.series (title, franchise, total_episodes, original_run, synopsis)
select
  'Tensou Sentai Goseiger',
  'Super Sentai',
  50,
  '2010-2011',
  'Five angel warriors known as Goseigers protect Earth from a succession of villainous groups — Warstar, the Yuumajuu, and the Matrintis Empire — using Gosei Power.'
where not exists (select 1 from public.series where title = 'Tensou Sentai Goseiger');

insert into public.series (title, franchise, total_episodes, original_run, synopsis)
select
  'Doubutsu Sentai Zyuohger',
  'Super Sentai',
  48,
  '2016-2017',
  'A young zoologist and four Zyumans from another world become the Zyuohgers to protect Earth from the Dethgalien hunters who chose it as the battleground for their 100th Blood Game.'
where not exists (select 1 from public.series where title = 'Doubutsu Sentai Zyuohger');

insert into public.series (title, franchise, total_episodes, original_run, synopsis)
select
  'Kishiryu Sentai Ryusoulger',
  'Super Sentai',
  48,
  '2019-2020',
  'Five Ryusoulgers wielding the power of dinosaurs defend Earth from the Druidon Tribe, a powerful race of monsters that fled to space 65 million years ago and have now returned to reclaim the planet.'
where not exists (select 1 from public.series where title = 'Kishiryu Sentai Ryusoulger');

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

-- Episodes for Ultraman Omega
-- Generated from data/episodes/ultraman-omega.csv — 25 episode(s). Idempotent (upsert).

begin;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 1, 'Here Comes an Alien', null, '2025-07-05'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 2, 'The Alien, Scholar, and I', null, '2025-07-12'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 3, 'Beware of the Cold Wave', null, '2025-07-19'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 4, 'Chasing the Claw Marks', null, '2025-07-26'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 5, 'Miko and Mikoto', null, '2025-08-02'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 6, 'The Kaiju''s Search', null, '2025-08-09'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 7, 'Caught a Cold', null, '2025-08-16'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 8, 'The Legend of Mt. Kirifuri', null, '2025-08-23'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 9, 'The Kanenari Kaiju Park', null, '2025-09-06'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 10, 'A Close-Up of the Two', null, '2025-09-13'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 11, 'Graim Returns', null, '2025-09-20'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 12, 'What I Want to Do', null, '2025-09-27'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 13, 'Ayu Finds Out!', null, '2025-10-04'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 14, 'Omega Elimination Order', null, '2025-10-11'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 15, 'Those Who Protect', null, '2025-10-18'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 16, 'The KSCT Special Task Unit', null, '2025-10-25'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 17, 'Snow Blossoms', null, '2025-11-08'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 18, 'The House of Barossa', null, '2025-11-15'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 19, 'Chasing the Starlight', null, '2025-11-22'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 20, 'Beyond Time', null, '2025-11-29'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 21, 'Raionji, Enraged', null, '2025-12-06'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 22, 'He Who Looks to the Stars', null, '2025-12-13'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 23, 'Space Gazers', null, '2025-12-20'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 24, 'The Final Blow', null, '2026-01-10'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Omega'), 25, 'Overlapping Futures', null, '2026-01-17'::date
where (select id from public.series where title = 'Ultraman Omega') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

commit;

-- Episodes for Ultraman Teo
-- Generated from data/episodes/ultraman-teo.csv — 2 episode(s). Idempotent (upsert).

begin;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Teo'), 1, 'The Man Who Came from H12', null, '2026-07-04'::date
where (select id from public.series where title = 'Ultraman Teo') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Ultraman Teo'), 2, 'Welcome to the Astronomy Club', null, '2026-07-11'::date
where (select id from public.series where title = 'Ultraman Teo') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

commit;

-- Episodes for Super Space Sheriff Gavan Infinity
-- series_id: 56e42d12-fe55-481d-a7a6-531224eace24 (hardcoded — title-independent)

begin;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 13, 'The Gavan Kidnapping', null, '2026-05-10') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 14, 'The Truth of the Universe', null, '2026-05-17') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 15, 'Patran''s Decision', null, '2026-05-24') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 16, 'Space Express Runaway', null, '2026-05-31') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 17, 'For Your Smiles', null, '2026-06-07') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 18, 'A Precious Person', null, '2026-06-14') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 19, 'Koto and Kiki', null, '2026-06-21') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 20, 'For Love''s Sake', null, '2026-06-28') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;
insert into public.episodes (series_id, episode_number, title, synopsis, air_date) values ('56e42d12-fe55-481d-a7a6-531224eace24', 21, 'Gavans, Assemble!', null, '2026-07-05') on conflict (series_id, episode_number) do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

commit;

-- Episodes for Tensou Sentai Goseiger
-- Generated from data/episodes/goseiger.csv — 50 episode(s). Idempotent (upsert).

begin;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 1, 'Magnificent Goseigers', null, '2010-02-14'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 2, 'Fantastic Goseigers', null, '2010-02-21'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 3, 'Landick Power Divided', null, '2010-02-28'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 4, 'Echo, the Angel''s Song', null, '2010-03-07'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 5, 'Magical Hyde', null, '2010-03-14'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 6, 'Breakout Goseigers', null, '2010-03-21'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 7, 'Protect the Earth!', null, '2010-03-28'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 8, 'Gosei Power, Running Wild', null, '2010-04-04'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 9, 'Gotcha☆Gosei Girls', null, '2010-04-11'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 10, 'Hyde''s Partner', null, '2010-04-18'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 11, 'Spark, Landick Power', null, '2010-04-25'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 12, 'Miracle Gosei Header Gathering', null, '2010-05-02'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 13, 'Run! Mystic Runner', null, '2010-05-09'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 14, 'The Strongest Tag Is Born!', null, '2010-05-16'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 15, 'Countdown to Earth''s End', null, '2010-05-23'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 16, 'Dynamic Alata', null, '2010-05-30'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 17, 'A New Enemy! Yuumajuu', null, '2010-06-06'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 18, 'The Knight of Fate Who Purifies the Earth', null, '2010-06-13'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 19, 'Gosei Knight Won''t Forgive', null, '2010-06-20'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 20, 'Falling in Love Goseigers', null, '2010-06-27'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 21, 'Elegant Eri', null, '2010-07-04'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 22, 'Over the Rainbow', null, '2010-07-18'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 23, 'Burn! Goseigers', null, '2010-07-25'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 24, 'Miracle Attack Goseigers', null, '2010-08-01'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 25, 'Nostalgic Moné', null, '2010-08-08'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 26, 'Guardian Angels Burst Out Laughing!', null, '2010-08-15'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 27, 'Awaken, Agri!', null, '2010-08-22'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 28, 'Father''s Treasure', null, '2010-08-29'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 29, 'Seal the Goseigers!', null, '2010-09-05'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 30, 'Romantic Eri', null, '2010-09-12'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 31, 'Never Give Up! Goseigers', null, '2010-09-19'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 32, 'Perform the Ultimate Miracle!', null, '2010-09-26'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 33, 'The Terror of the Matrintis Empire', null, '2010-10-03'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 34, 'Gosei Knight Justice', null, '2010-10-10'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 35, 'Find the Perfect Leader!', null, '2010-10-17'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 36, 'Run, Agri!', null, '2010-10-24'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 37, 'Exciting Moné', null, '2010-10-31'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 38, 'Alice vs. Gosei Knight', null, '2010-11-07'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 39, 'Epic Zero', null, '2010-11-14'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 40, 'Strong Alata', null, '2010-11-21'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 41, 'Explosive Bond!', null, '2010-11-28'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 42, 'Passionate Hyde', null, '2010-12-05'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 43, 'Empire''s All-Out Offensive', null, '2010-12-12'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 44, 'The Ultimate Final Battle', null, '2010-12-19'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 45, 'The Birth of the Earth Savior', null, '2010-12-26'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 46, 'Gosei Knight Targeted', null, '2011-01-09'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 47, 'The Trap of the Earth Purification Plan', null, '2011-01-16'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 48, 'Battling Gosei Power', null, '2011-01-23'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 49, 'Battling for the Future', null, '2011-01-30'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Tensou Sentai Goseiger'), 50, 'It Is a Guardian Angel''s Mission to Protect the Earth', null, '2011-02-06'::date
where (select id from public.series where title = 'Tensou Sentai Goseiger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

commit;

-- Episodes for Doubutsu Sentai Zyuohger
-- Generated from data/episodes/zyuohger.csv — 48 episode(s). Idempotent (upsert).

begin;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 1, 'The Exciting Animal Land', null, '2016-02-14'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 2, 'Don''t Underestimate This Planet', null, '2016-02-21'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 3, 'I Want to Go Home but We Can''t Go Home', null, '2016-02-28'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 4, 'Roar in the Ring', null, '2016-03-06'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 5, 'Champion of the Jungle', null, '2016-03-13'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 6, 'A Wild Present', null, '2016-03-20'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 7, 'Go-Go-Go Ghost Appears', null, '2016-03-27'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 8, 'Savanna''s Melody', null, '2016-04-03'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 9, 'The Endless Day', null, '2016-04-10'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 10, 'The Most Dangerous Game', null, '2016-04-17'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 11, 'Animal Assembly', null, '2016-04-24'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 12, 'The Short-Nosed Elephant', null, '2016-05-01'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 13, 'The Summit Witness', null, '2016-05-08'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 14, 'The Foolish Lying Thief', null, '2016-05-15'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 15, 'The Terrifying Sniper', null, '2016-05-22'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 16, 'Find Zyumans', null, '2016-05-29'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 17, 'The Extra Player''s Intrusion', null, '2016-06-05'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 18, 'Etched Terror', null, '2016-06-12'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 19, 'Who to Believe in', null, '2016-06-26'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 20, 'Champion of the World', null, '2016-07-03'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 21, 'Prison Break', null, '2016-07-17'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 22, 'Awakening? Is It Wrong?', null, '2016-07-24'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 23, 'Megabeast Hunter', null, '2016-07-31'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 24, 'Revived Memory', null, '2016-08-07'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 25, 'Unhappy Camera', null, '2016-08-14'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 26, 'I Want to Protect the Precious Day', null, '2016-08-21'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 27, 'Which One Is Real?', null, '2016-08-28'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 28, 'The Space Pirates Return', null, '2016-09-04'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 29, 'Champion of the Champions', null, '2016-09-11'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 30, 'The Legendary Megabeast', null, '2016-09-18'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 31, 'When the Megabeast Stands', null, '2016-09-25'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 32, 'The Dark Side of the Heart', null, '2016-10-02'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 33, 'Nekodamashi and Gratitude', null, '2016-10-09'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 34, 'The Megabeast Hunter Strikes Back', null, '2016-10-16'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 35, 'The Last Day of the Zyuohgers', null, '2016-10-23'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 36, 'The Prince of Halloween', null, '2016-10-30'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 37, 'Champion of the Heavens', null, '2016-11-13'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 38, 'High in the Sky, Flying Wings', null, '2016-11-20'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 39, 'Calories and a Necklace', null, '2016-11-27'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 40, 'Men''s Aesthetics', null, '2016-12-04'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 41, 'The First and the Last Chance', null, '2016-12-11'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 42, 'The Fate of This Planet', null, '2016-12-18'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 43, 'The Christmas Witness', null, '2016-12-25'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 44, 'Champion of Humanity', null, '2017-01-08'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 45, 'The Broken Seal', null, '2017-01-15'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 46, 'The Immortal God of Destruction', null, '2017-01-22'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 47, 'The Last Game', null, '2017-01-29'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Doubutsu Sentai Zyuohger'), 48, 'Earth Is Our Home', null, '2017-02-05'::date
where (select id from public.series where title = 'Doubutsu Sentai Zyuohger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

commit;

-- Episodes for Kishiryu Sentai Ryusoulger
-- Generated from data/episodes/ryusoulger.csv — 48 episode(s). Idempotent (upsert).

begin;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 1, 'Que Boom!! Ryusoulger', null, '2019-03-17'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 2, 'Bring Them Together! Ryusoul', null, '2019-03-24'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 3, 'The Cursed Gaze', null, '2019-03-31'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 4, 'Dragon vs Tiger!! The Fastest Battle', null, '2019-04-07'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 5, 'The Hellhound', null, '2019-04-14'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 6, 'Counterattack!! Tankjoh', null, '2019-04-21'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 7, 'The Princess of Cepheus', null, '2019-04-28'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 8, 'The Miraculous Singing Voice', null, '2019-05-05'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 9, 'The Suspicious Treasure Chest', null, '2019-05-12'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 10, 'The Invincible Counter', null, '2019-05-19'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 11, 'The Blazing Quiz King', null, '2019-05-26'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 12, 'The Scorching Illusion', null, '2019-06-02'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 13, 'A Ryusoul Tribesman for Prime Minister!?', null, '2019-06-09'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 14, 'The Golden Knight', null, '2019-06-23'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 15, 'The King of the Deep Sea', null, '2019-06-30'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 16, 'Sunken Hope', null, '2019-07-07'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 17, 'The Captive Brave', null, '2019-07-14'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 18, 'Huge Pinch! Unable to Transform!', null, '2019-07-21'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 19, 'Tiramigo''s Advance', null, '2019-07-28'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 20, 'The Supreme Artist', null, '2019-08-04'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 21, 'The Light and Dark Kishiryu', null, '2019-08-11'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 22, 'The Life of the Dead!?', null, '2019-08-18'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 23, 'The Phantom Ryusoul', null, '2019-08-25'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 24, 'The Karate Dojo of Love', null, '2019-09-01'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 25, 'Dancing Kleon', null, '2019-09-08'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 26, 'The 7th Knight', null, '2019-09-15'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 27, 'The Invincible Fist', null, '2019-09-22'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 28, 'Micro Battle', null, '2019-09-29'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 29, 'Canalo''s Marriage', null, '2019-10-06'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 30, 'Beat the High Specs', null, '2019-10-13'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 31, 'Melody from the Sky', null, '2019-10-20'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 32, 'When the Rain of Hatred Ceases', null, '2019-10-27'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 33, 'The New Assassin', null, '2019-11-10'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 34, 'The Space Fierce Dragon Appears!', null, '2019-11-17'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 35, 'The Greatest Battle on Earth', null, '2019-11-24'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 36, 'The Supersonic Bodyguard', null, '2019-12-01'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 37, 'Birth! The Strongest Tag', null, '2019-12-08'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 38, 'The Temple in the Sky', null, '2019-12-15'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 39, 'Stolen Holy Night', null, '2019-12-22'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 40, 'Nightmare in the Fog', null, '2020-01-05'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 41, 'The Vanished Holy Sword', null, '2020-01-05'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 42, 'The Stage of the Decisive Battle', null, '2020-01-19'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 43, 'The Druidon''s Mother', null, '2020-01-26'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 44, 'The Tested Bond', null, '2020-02-02'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 45, 'Take Back the Heart!', null, '2020-02-09'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 46, 'The Noble Kishiryu', null, '2020-02-16'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 47, 'Between Happiness and Despair', null, '2020-02-23'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

insert into public.episodes (series_id, episode_number, title, synopsis, air_date)
select (select id from public.series where title = 'Kishiryu Sentai Ryusoulger'), 48, 'The Will of the Earth', null, '2020-03-01'::date
where (select id from public.series where title = 'Kishiryu Sentai Ryusoulger') is not null
on conflict (series_id, episode_number)
do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;

commit;
