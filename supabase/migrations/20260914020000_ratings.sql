create table public.title_ratings(
 user_id uuid not null references auth.users(id) on delete cascade,
 series_id uuid not null references public.series(id) on delete cascade,
 score integer not null check(score between 1 and 10), updated_at timestamptz not null default now(),
 primary key(user_id,series_id)
);
alter table public.title_ratings enable row level security;
create policy ratings_read on public.title_ratings for select using(user_id=auth.uid());
create policy ratings_insert on public.title_ratings for insert with check(user_id=auth.uid());
create policy ratings_update on public.title_ratings for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy ratings_delete on public.title_ratings for delete using(user_id=auth.uid());
create function public.validate_title_rating() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.user_series_progress p join public.series s on s.id=p.series_id
 where p.user_id=new.user_id and p.series_id=new.series_id and not s.hidden and
 ((s.format='series' and p.current_episode>=1) or (s.format='movie' and p.current_episode=1 and p.status='completed')))
 then raise exception 'Start this series or mark this movie watched before rating'; end if;
 new.updated_at:=now(); return new;
end $$;
create trigger validate_rating before insert or update on public.title_ratings for each row execute function public.validate_title_rating();

-- Only aggregates escape this security-definer boundary, never voters or private progress.
create function public.catalog_scores() returns table(series_id uuid,average_score numeric,vote_count bigint)
language sql stable security definer set search_path='' as $$
 select r.series_id,avg(r.score),count(*) from public.title_ratings r
 join public.user_series_progress p on p.user_id=r.user_id and p.series_id=r.series_id
 join public.series s on s.id=r.series_id where not s.hidden and
 ((s.format='series' and p.current_episode>=1) or (s.format='movie' and p.current_episode=1 and p.status='completed'))
 group by r.series_id
$$;
create function public.catalog_page(p_filter text default 'all',p_query text default '',p_page integer default 1,p_ranked boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 with filtered as (
  select s.*,coalesce(r.vote_count,0) as vote_count,r.average_score
  from public.series s left join public.catalog_scores() r on r.series_id=s.id
  where not s.hidden and (p_filter='all' or (p_filter='movies' and s.format='movie') or (p_filter in ('anime','tokusatsu') and s.category=p_filter))
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
grant execute on function public.catalog_scores(),public.catalog_page(text,text,integer,boolean) to anon,authenticated;
