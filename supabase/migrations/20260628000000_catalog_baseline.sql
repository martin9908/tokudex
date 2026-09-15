-- Baseline for fresh installations. Existing tables and all their rows are preserved.
-- Columns, defaults and constraints verified against a read-only deployed schema dump on 2026-09-14.
create table if not exists public.series (
 id uuid primary key default gen_random_uuid(), title text not null, franchise text,
 total_episodes integer, synopsis text, created_at timestamp default now(),
 cover_image_url text, copyright_notice text, original_run text
);
create table if not exists public.episodes (
 id uuid primary key default gen_random_uuid(), series_id uuid not null references public.series(id) on delete cascade,
 episode_number integer not null, title text not null, synopsis text, air_date date,
 created_at timestamp default now(), unique(series_id, episode_number)
);
create table if not exists public.user_series_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 series_id uuid references public.series(id) on delete cascade, current_episode integer default 1,
 status text default 'watching',
 last_watched_at timestamp default now(), updated_at timestamp default now(), unique(user_id,series_id)
);
create table if not exists public.episode_notes (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 series_id uuid references public.series(id) on delete cascade, episode_number integer not null,
 note text, created_at timestamp default now(), unique(user_id,series_id,episode_number)
);
