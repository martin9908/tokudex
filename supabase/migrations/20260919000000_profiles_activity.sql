-- Public handles, a shared activity feed, notification preferences, and the
-- catalog filters the community dex needs. Additive only: nothing existing is
-- dropped or rewritten except the catalog_page function, which keeps its
-- signature and gains filters.

-- Profiles: the only thing about a member that other members can see.
create table public.profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check(handle ~ '^[a-z0-9_]{3,20}$'),
 display_name text check(length(display_name) <= 80),
 share_activity boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select using(true);
create policy profiles_insert on public.profiles for insert with check(user_id=auth.uid());
create policy profiles_update on public.profiles for update using(user_id=auth.uid()) with check(user_id=auth.uid());

create function public.set_profile(p_handle text, p_display text default null, p_share_activity boolean default null)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare result public.profiles; wanted text;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 wanted := lower(trim(coalesce(p_handle,'')));
 if wanted !~ '^[a-z0-9_]{3,20}$' then raise exception 'Handles are 3–20 letters, numbers or underscores'; end if;
 if exists(select 1 from public.profiles where handle=wanted and user_id<>auth.uid()) then raise exception 'That handle is taken'; end if;
 insert into public.profiles(user_id,handle,display_name,share_activity)
 values(auth.uid(),wanted,nullif(trim(p_display),''),coalesce(p_share_activity,true))
 on conflict(user_id) do update set handle=excluded.handle,
  display_name=coalesce(excluded.display_name,public.profiles.display_name),
  share_activity=coalesce(p_share_activity,public.profiles.share_activity)
 returning * into result;
 return result;
end $$;
revoke all on function public.set_profile(text,text,boolean) from public;
grant execute on function public.set_profile(text,text,boolean) to authenticated;

-- Notification preferences: own row only.
create table public.notification_prefs(
 user_id uuid primary key references auth.users(id) on delete cascade,
 weekly_recap boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create policy prefs_read on public.notification_prefs for select using(user_id=auth.uid());
create policy prefs_insert on public.notification_prefs for insert with check(user_id=auth.uid());
create policy prefs_update on public.notification_prefs for update using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Activity: what people logged, kept for 90 days. Never notes, never ratings.
create table public.activity(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('logged','finished','shelved','added','corrected')),
 series_id uuid not null references public.series(id) on delete cascade,
 episode integer,
 created_at timestamptz not null default now()
);
create index activity_recent on public.activity(created_at desc);
create index activity_by_user on public.activity(user_id,created_at desc);
alter table public.activity enable row level security;
create policy activity_read on public.activity for select using(
 created_at > now() - interval '90 days' and exists(select 1 from public.series s where s.id=series_id and not s.hidden)
);

create function public.activity_from_progress() returns trigger language plpgsql security definer set search_path='' as $$
declare kind text; item public.series;
begin
 if not exists(select 1 from public.profiles where user_id=new.user_id and share_activity) then return new; end if;
 select * into item from public.series where id=new.series_id;
 if tg_op='UPDATE' and old.status is distinct from new.status and new.status='completed' then kind:='finished';
 elsif tg_op='INSERT' and new.status='completed' then kind:='finished';
 elsif tg_op='UPDATE' and old.status is distinct from new.status and new.status='on_hold' then kind:='shelved';
 elsif new.current_episode > 0 and (tg_op='INSERT' or new.current_episode > coalesce(old.current_episode,0)) then kind:='logged';
 else return new; end if;
 if kind='logged' and item.format='movie' then kind:='finished'; end if;
 insert into public.activity(user_id,kind,series_id,episode) values(new.user_id,kind,new.series_id,new.current_episode);
 delete from public.activity where created_at < now() - interval '90 days';
 return new;
end $$;
create trigger activity_progress after insert or update on public.user_series_progress for each row execute function public.activity_from_progress();

create function public.activity_from_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='published' and old.status<>'published' and new.author_id is not null and new.series_id is not null
  and exists(select 1 from public.profiles where user_id=new.author_id and share_activity) then
  insert into public.activity(user_id,kind,series_id) values(new.author_id,case when old.series_id is null then 'added' else 'corrected' end,new.series_id);
 end if;
 return new;
end $$;
create trigger activity_publication after update on public.catalog_submissions for each row execute function public.activity_from_publication();

-- Who first added a title: the author of the published submission that created it.
create function public.catalog_credits(p_ids uuid[]) returns table(series_id uuid,handle text,display_name text)
language sql stable security definer set search_path='' as $$
 select distinct on (c.series_id) c.series_id,p.handle,p.display_name from public.catalog_submissions c
 join public.profiles p on p.user_id=c.author_id
 where c.status='published' and c.base_revision is null and c.series_id=any(p_ids)
 order by c.series_id,c.reviewed_at
$$;
grant execute on function public.catalog_credits(uuid[]) to anon,authenticated;

-- Titles with some votes but not yet the five needed to rank.
create function public.catalog_nearly_ranked() returns table(series_id uuid,title text,vote_count bigint)
language sql stable security definer set search_path='' as $$
 select s.id,s.title,r.vote_count from public.catalog_scores() r join public.series s on s.id=r.series_id
 where r.vote_count between 1 and 4 and not s.hidden order by r.vote_count desc,s.title limit 3
$$;
grant execute on function public.catalog_nearly_ranked() to anon,authenticated;

-- catalog_page: same signature, more filters (sentai/rider/ultra by franchise,
-- needs_work = no poster or an incomplete episode list) and an episode count.
create or replace function public.catalog_page(p_filter text default 'all',p_query text default '',p_page integer default 1,p_ranked boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 with filtered as (
  select s.*,coalesce(r.vote_count,0) as vote_count,r.average_score,
   (select count(*) from public.episodes e where e.series_id=s.id) as episode_count
  from public.series s left join public.catalog_scores() r on r.series_id=s.id
  where not s.hidden and (p_filter='all' or (p_filter='movies' and s.format='movie') or (p_filter in ('anime','tokusatsu') and s.category=p_filter)
   or (p_filter='sentai' and s.franchise='Super Sentai') or (p_filter='rider' and s.franchise='Kamen Rider') or (p_filter='ultra' and s.franchise='Ultraman')
   or (p_filter='needs_work' and (s.cover_image_url is null or (s.format='series' and s.total_episodes is not null and (select count(*) from public.episodes e where e.series_id=s.id) < s.total_episodes))))
 ), prior as (
  select coalesce(sum(average_score*vote_count)/nullif(sum(vote_count),0),5.5) as mean from filtered
 ), results as (
  select f.*,(coalesce(average_score,0)*vote_count+10*prior.mean)/(vote_count+10) as weighted_score
  from filtered f cross join prior
  where (not p_ranked or vote_count>=5) and
  (strpos(lower(f.title),lower(left(coalesce(p_query,''),200)))>0 or strpos(lower(coalesce(f.synopsis,'')),lower(left(coalesce(p_query,''),200)))>0)
 ), paged as (
  select * from results order by
   case when p_ranked then weighted_score end desc,
   case when p_ranked then vote_count end desc,
   case when not p_ranked then release_year end desc nulls last,title,id
  limit 24 offset ((greatest(1,least(coalesce(p_page,1),100000))-1)*24)
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb),
  'total',(select count(*) from results),'page',greatest(1,least(coalesce(p_page,1),100000)))
$$;
