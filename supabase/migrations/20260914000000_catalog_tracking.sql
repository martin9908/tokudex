alter table public.series
 add column category text not null default 'tokusatsu' check(category in ('tokusatsu','anime','other')),
 add column format text not null default 'series' check(format in ('series','movie')),
 add column release_year integer check(release_year between 1800 and 2200),
 add column runtime_minutes integer check(runtime_minutes between 1 and 10000),
 add column revision integer not null default 1,
 add column hidden boolean not null default false,
 add constraint catalog_category_format check(category <> 'other' or format = 'movie'),
 add constraint catalog_movie_count check(format <> 'movie' or (total_episodes is not null and total_episodes = 1));
update public.series set release_year = substring(original_run from '(?:19|20)[0-9]{2}')::integer
 where original_run ~ '(?:19|20)[0-9]{2}';
alter table public.user_series_progress add column movie_note text check(length(movie_note) <= 5000);
create index catalog_browse on public.series(hidden,category,format,release_year desc,title,id);

-- Guard direct REST writes too; users cannot bypass the application's progress rules.
create function public.validate_tracking() returns trigger language plpgsql security definer set search_path = '' as $$
declare item public.series;
begin
 select * into item from public.series where id = new.series_id for share;
 if not found then raise exception 'Title not found'; end if;
 if tg_table_name = 'user_series_progress' then
  if new.current_episode is null or new.current_episode < 0 or (new.status is null or new.status not in ('watching','completed','on_hold','plan_to_watch')) then raise exception 'Invalid progress'; end if;
  if item.format = 'movie' then
   if not ((new.current_episode = 0 and new.status = 'plan_to_watch') or
           (new.current_episode = 1 and new.status = 'completed')) then raise exception 'Movies must be planned or watched'; end if;
  elsif new.movie_note is not null then raise exception 'Movie notes are only for movies';
  end if;
  if item.total_episodes is not null and new.current_episode > item.total_episodes then raise exception 'Progress exceeds episode count'; end if;
 else
  if item.format = 'movie' or new.episode_number < 1 or
    (item.total_episodes is not null and new.episode_number > item.total_episodes) or length(new.note) > 5000
    then raise exception 'Invalid episode note'; end if;
 end if;
 return new;
end $$;
create trigger validate_progress before insert or update on public.user_series_progress for each row execute function public.validate_tracking();
create trigger validate_note before insert or update on public.episode_notes for each row execute function public.validate_tracking();

create function public.save_tracking(p_series_id uuid, p_episode integer, p_status text default null,
 p_note text default null, p_note_episode integer default null, p_add_only boolean default false)
returns public.user_series_progress language plpgsql security definer set search_path = '' as $$
declare item public.series; result public.user_series_progress; current_ep integer; chosen_status text;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 select * into item from public.series where id=p_series_id and not hidden for share;
 if not found then raise exception 'Title not found'; end if;
 if p_episode is null or p_episode < 0 then raise exception 'Invalid episode number'; end if;
 if item.format='movie' and p_episode not in (0,1) then raise exception 'Invalid movie progress'; end if;
 current_ep := least(p_episode,coalesce(item.total_episodes,p_episode));
 chosen_status := coalesce(p_status,case when current_ep=0 then 'plan_to_watch'
  when item.total_episodes is not null and current_ep >= item.total_episodes then 'completed' else 'watching' end);
 if p_note is not null and length(p_note)>5000 then raise exception 'Note is too long'; end if;
 insert into public.user_series_progress(user_id,series_id,current_episode,status,movie_note,last_watched_at,updated_at)
 values(auth.uid(),p_series_id,current_ep,chosen_status,case when item.format='movie' then p_note end,now(),now())
 on conflict(user_id,series_id) do update set current_episode=excluded.current_episode,status=excluded.status,
 movie_note=coalesce(excluded.movie_note,public.user_series_progress.movie_note),last_watched_at=now(),updated_at=now()
 where not p_add_only returning * into result;
 if result.id is null then select * into result from public.user_series_progress where user_id=auth.uid() and series_id=p_series_id; end if;
 if item.format='series' and p_note is not null and p_note_episode is not null then
  insert into public.episode_notes(user_id,series_id,episode_number,note)
  values(auth.uid(),p_series_id,p_note_episode,trim(p_note))
  on conflict(user_id,series_id,episode_number) do update set note=excluded.note;
 end if;
 return result;
end $$;
revoke all on function public.save_tracking(uuid,integer,text,text,integer,boolean) from public;
grant execute on function public.save_tracking(uuid,integer,text,text,integer,boolean) to authenticated;
