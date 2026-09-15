create table public.catalog_admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.catalog_trust(
 user_id uuid primary key references auth.users(id) on delete cascade,
 kind text not null check(kind in ('contributor','supporter')), expires_at timestamptz,
 granted_by uuid references auth.users(id) on delete set null, granted_at timestamptz not null default now(),
 check(kind <> 'supporter' or expires_at is not null)
);
create function public.is_catalog_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.catalog_admins where user_id=auth.uid())
$$;
create function public.can_publish_catalog() returns boolean language sql stable security definer set search_path='' as $$
 select public.is_catalog_admin() or exists(select 1 from public.catalog_trust where user_id=auth.uid() and (expires_at is null or expires_at>now()))
$$;
alter table public.catalog_admins enable row level security;
alter table public.catalog_trust enable row level security;
create policy admin_read on public.catalog_admins for select using(user_id=auth.uid());
create policy trust_read on public.catalog_trust for select using(user_id=auth.uid() or public.is_catalog_admin());
create policy trust_manage on public.catalog_trust for all using(public.is_catalog_admin()) with check(public.is_catalog_admin() and granted_by=auth.uid());

create table public.catalog_submissions(
 id uuid primary key default gen_random_uuid(), author_id uuid references auth.users(id) on delete set null,
 series_id uuid references public.series(id), base_revision integer, payload jsonb not null,
 sources text[] not null, status text not null default 'pending' check(status in ('pending','published','rejected')),
 reason text, reviewer_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table public.catalog_history(
 id uuid primary key default gen_random_uuid(), series_id uuid not null references public.series(id),
 revision integer not null, snapshot jsonb not null, sources text[] not null default '{}',
 actor_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
 unique(series_id,revision)
);
create table public.catalog_attempts(user_id uuid references auth.users(id) on delete cascade, day date not null, attempts integer not null, primary key(user_id,day));
create table public.catalog_reports(
 id uuid primary key default gen_random_uuid(), series_id uuid not null references public.series(id),
 author_id uuid references auth.users(id) on delete set null, reason text not null check(length(trim(reason)) between 1 and 2000),
 resolved boolean not null default false, created_at timestamptz not null default now()
);
alter table public.catalog_submissions enable row level security;
alter table public.catalog_history enable row level security;
alter table public.catalog_attempts enable row level security;
alter table public.catalog_reports enable row level security;
create policy submission_read on public.catalog_submissions for select using(author_id=auth.uid() or public.is_catalog_admin());
create policy history_read on public.catalog_history for select using(public.is_catalog_admin());
create policy report_read on public.catalog_reports for select using(author_id=auth.uid() or public.is_catalog_admin());
create policy report_insert on public.catalog_reports for insert with check(author_id=auth.uid() and not resolved);
create policy report_update on public.catalog_reports for update using(public.is_catalog_admin()) with check(public.is_catalog_admin());

-- Hidden titles remain available to owners of tracking history, but not public discovery.
drop policy series_public_read on public.series;
create policy series_public_read on public.series for select using(not hidden or public.is_catalog_admin() or exists(
 select 1 from public.user_series_progress p where p.series_id=series.id and p.user_id=auth.uid()));
drop policy episodes_public_read on public.episodes;
create policy episodes_public_read on public.episodes for select using(exists(select 1 from public.series s where s.id=series_id));

create function public.catalog_snapshot(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(s) || jsonb_build_object('episodes',coalesce((select jsonb_agg(to_jsonb(e) order by episode_number) from public.episodes e where e.series_id=s.id),'[]'::jsonb))
 from public.series s where s.id=p_id
$$;
-- Private helper: callable only by privileged workflow functions.
revoke all on function public.catalog_snapshot(uuid) from public,anon,authenticated;
insert into public.catalog_history(series_id,revision,snapshot) select id,revision,public.catalog_snapshot(id) from public.series;

create function public.validate_catalog_payload(p jsonb, sources text[]) returns void language plpgsql set search_path='' as $$
declare ep jsonb; n integer;
begin
 if jsonb_typeof(p) is distinct from 'object' or length(trim(coalesce(p->>'title',''))) not between 1 and 300
 or coalesce(p->>'category','') not in ('tokusatsu','anime','other') or coalesce(p->>'format','') not in ('series','movie')
 or (p->>'category'='other' and p->>'format'<>'movie') then raise exception 'Invalid title, category or format'; end if;
 if cardinality(sources) is null or cardinality(sources) not between 1 and 10 or exists(select 1 from unnest(sources) u where u is null or u !~ '^https://[^/[:space:]]+[^[:space:]]*$' or length(u)>2000)
 then raise exception 'Add at least one HTTPS source (maximum 10)'; end if;
 if length(coalesce(p->>'synopsis',''))>5000 or length(coalesce(p->>'franchise',''))>200 then raise exception 'Description is too long'; end if;
 if (p->>'release_year')::integer not between 1800 and 2200 or (p->>'runtime_minutes')::integer not between 1 and 10000
 or (p->>'total_episodes')::integer not between 1 and 100000 then raise exception 'Invalid year, runtime or episode count'; end if;
 if p ? 'episodes' and jsonb_typeof(p->'episodes') <> 'array' then raise exception 'Episodes must be a list'; end if;
 if jsonb_array_length(coalesce(p->'episodes','[]'))>1000 then raise exception 'Maximum 1000 episodes per submission'; end if;
 if p->>'format'='movie' and jsonb_array_length(coalesce(p->'episodes','[]'))>0 then raise exception 'Movies do not have episodes'; end if;
 for ep in select value from jsonb_array_elements(coalesce(p->'episodes','[]')) loop
  n := (ep->>'episode_number')::integer;
  if n is null or n<1 or n>coalesce((p->>'total_episodes')::integer,100000) or length(trim(coalesce(ep->>'title',''))) not between 1 and 300
   or length(coalesce(ep->>'synopsis',''))>5000 or (ep->>'episode_type' is not null and ep->>'episode_type' not in ('filler','clip_show','recap','special','crossover')) then raise exception 'Invalid episode'; end if;
  perform (ep->>'air_date')::date;
 end loop;
 if (select count(*) <> count(distinct value->>'episode_number') from jsonb_array_elements(coalesce(p->'episodes','[]'))) then raise exception 'Duplicate episode numbers'; end if;
end $$;

create function public.publish_catalog_submission(p_submission uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare sub public.catalog_submissions; item public.series; p jsonb; ep jsonb; target uuid; norm text;
begin
 select * into sub from public.catalog_submissions where id=p_submission for update;
 if not found or auth.uid() is null or not(public.is_catalog_admin() or (sub.author_id=auth.uid() and public.can_publish_catalog())) then raise exception 'Unauthorized'; end if;
 if sub.status='published' then return sub.series_id; end if;
 if sub.status<>'pending' then raise exception 'Submission is not pending'; end if;
 p := sub.payload;
 perform public.validate_catalog_payload(p,sub.sources);
 norm := lower(regexp_replace(trim(p->>'title'),'\s+',' ','g'));
 -- Serialize publications so concurrent additions cannot pass the duplicate check together.
 perform pg_advisory_xact_lock(83194001);
 if exists(select 1 from public.series where lower(regexp_replace(trim(title),'\s+',' ','g'))=norm
  and category=p->>'category' and format=p->>'format' and release_year is not distinct from (p->>'release_year')::integer
  and id is distinct from sub.series_id) then raise exception 'An identical title already exists'; end if;
 if sub.series_id is not null then
  select * into item from public.series where id=sub.series_id for update;
  if not found or item.revision is distinct from sub.base_revision then raise exception 'Title changed; reload and resubmit your correction'; end if;
  if item.format<>p->>'format' or item.category<>p->>'category' then raise exception 'Existing category and format cannot change; submit a separate title'; end if;
  if item.hidden and not public.is_catalog_admin() then raise exception 'Title is hidden'; end if;
  if (p->>'total_episodes')::integer < greatest(coalesce((select max(current_episode) from public.user_series_progress where series_id=item.id),0),coalesce((select max(episode_number) from public.episodes where series_id=item.id),0),coalesce((select max(episode_number) from public.episode_notes where series_id=item.id),0)) and item.format='series'
   then raise exception 'Episode count cannot discard existing progress or episodes'; end if;
  target:=item.id;
 else
  insert into public.series(title) values(trim(p->>'title')) returning id into target;
 end if;
 update public.series set title=trim(p->>'title'),category=p->>'category',format=p->>'format',
  total_episodes=case when p->>'format'='movie' then 1 else (p->>'total_episodes')::integer end,
  synopsis=nullif(trim(p->>'synopsis'),''),franchise=nullif(trim(p->>'franchise'),''),release_year=(p->>'release_year')::integer,
  original_run=coalesce(p->>'original_run',p->>'release_year'),runtime_minutes=(p->>'runtime_minutes')::integer,
  revision=case when sub.series_id is null then 1 else revision+1 end where id=target;
 for ep in select value from jsonb_array_elements(coalesce(p->'episodes','[]')) loop
  insert into public.episodes(series_id,episode_number,title,synopsis,air_date,episode_type)
  values(target,(ep->>'episode_number')::integer,trim(ep->>'title'),ep->>'synopsis',(ep->>'air_date')::date,ep->>'episode_type')
  on conflict(series_id,episode_number) do update set title=excluded.title,synopsis=excluded.synopsis,air_date=excluded.air_date,episode_type=excluded.episode_type;
 end loop;
 insert into public.catalog_history(series_id,revision,snapshot,sources,actor_id)
 select id,revision,public.catalog_snapshot(id),sub.sources,auth.uid() from public.series where id=target;
 update public.catalog_submissions set status='published',series_id=target,reviewer_id=auth.uid(),reviewed_at=now() where id=sub.id;
 return target;
end $$;

-- Validation failures return data, not exceptions, so the daily attempt counter commits.
create function public.submit_catalog(p_payload jsonb,p_sources text[],p_series_id uuid default null,p_base_revision integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare attempts_today integer; submission uuid; target uuid;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 insert into public.catalog_attempts values(auth.uid(),(now() at time zone 'UTC')::date,1)
 on conflict(user_id,day) do update set attempts=public.catalog_attempts.attempts+1 returning attempts into attempts_today;
 if attempts_today>10 then return jsonb_build_object('error','Daily limit reached. Try again tomorrow.'); end if;
 begin
  perform public.validate_catalog_payload(p_payload,p_sources);
  if p_series_id is not null and not exists(select 1 from public.series where id=p_series_id and not hidden and revision=p_base_revision) then raise exception 'Title changed; reload before submitting'; end if;
  insert into public.catalog_submissions(author_id,series_id,base_revision,payload,sources)
  values(auth.uid(),p_series_id,p_base_revision,p_payload,p_sources) returning id into submission;
  if public.can_publish_catalog() then target:=public.publish_catalog_submission(submission); end if;
  return jsonb_build_object('id',submission,'series_id',target,'published',target is not null);
 exception when others then
  return jsonb_build_object('error',sqlerrm);
 end;
end $$;
create function public.review_catalog(p_id uuid,p_approve boolean,p_reason text default null,p_payload jsonb default null,p_sources text[] default null)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not public.is_catalog_admin() then raise exception 'Unauthorized'; end if;
 perform 1 from public.catalog_submissions where id=p_id and status='pending' for update;
 if not found then raise exception 'Submission is not pending'; end if;
 if p_approve then
  update public.catalog_submissions set payload=coalesce(p_payload,payload),sources=coalesce(p_sources,sources) where id=p_id;
  return public.publish_catalog_submission(p_id);
 end if;
 if length(trim(coalesce(p_reason,''))) not between 1 and 2000 then raise exception 'A rejection reason is required'; end if;
 update public.catalog_submissions set status='rejected',reason=trim(p_reason),reviewer_id=auth.uid(),reviewed_at=now() where id=p_id;
 return null;
end $$;

create function public.moderate_catalog(p_id uuid,p_revision integer,p_hidden boolean default null,p_cover text default null,p_history_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare item public.series; snap jsonb; ep jsonb;
begin
 if not public.is_catalog_admin() then raise exception 'Unauthorized'; end if;
 perform pg_advisory_xact_lock(83194001);
 select * into item from public.series where id=p_id for update;
 if not found or item.revision<>p_revision then raise exception 'Title changed; reload before moderating'; end if;
 if p_history_id is not null then
  select snapshot into snap from public.catalog_history where id=p_history_id and series_id=p_id;
  if snap is null then raise exception 'Revision not found'; end if;
  if exists(select 1 from public.series where id<>p_id and category=item.category and format=item.format
    and lower(regexp_replace(trim(title),'\s+',' ','g'))=lower(regexp_replace(trim(snap->>'title'),'\s+',' ','g'))
    and release_year is not distinct from (snap->>'release_year')::integer) then raise exception 'Restoring would duplicate an existing title'; end if;
  -- Keep totals large enough for existing user progress; never erase private history.
  update public.series set title=snap->>'title',synopsis=snap->>'synopsis',franchise=snap->>'franchise',
   release_year=(snap->>'release_year')::integer,original_run=snap->>'original_run',runtime_minutes=(snap->>'runtime_minutes')::integer,
   total_episodes=case when snap->>'total_episodes' is null then null else greatest((snap->>'total_episodes')::integer,coalesce((select max(current_episode) from public.user_series_progress where series_id=p_id),0),coalesce((select max(episode_number) from public.episode_notes where series_id=p_id),0)) end,
   cover_image_url=snap->>'cover_image_url' where id=p_id;
  delete from public.episodes where series_id=p_id and episode_number not in (select (value->>'episode_number')::integer from jsonb_array_elements(snap->'episodes'));
  for ep in select value from jsonb_array_elements(snap->'episodes') loop
   insert into public.episodes(series_id,episode_number,title,synopsis,air_date,episode_type)
   values(p_id,(ep->>'episode_number')::integer,ep->>'title',ep->>'synopsis',(ep->>'air_date')::date,ep->>'episode_type')
   on conflict(series_id,episode_number) do update set title=excluded.title,synopsis=excluded.synopsis,air_date=excluded.air_date,episode_type=excluded.episode_type;
  end loop;
 end if;
 if p_cover is not null and p_cover<>'' and p_cover !~ '^https://vjdbddflaiuogawqggav[.]supabase[.]co/storage/v1/object/public/[^[:space:]]+$' then raise exception 'Use an approved Supabase Storage image'; end if;
 update public.series set hidden=coalesce(p_hidden,hidden),cover_image_url=case when p_cover is null then cover_image_url else nullif(p_cover,'') end,revision=revision+1 where id=p_id;
 insert into public.catalog_history(series_id,revision,snapshot,actor_id) select id,revision,public.catalog_snapshot(id),auth.uid() from public.series where id=p_id;
end $$;
revoke all on function public.submit_catalog(jsonb,text[],uuid,integer),public.publish_catalog_submission(uuid),public.review_catalog(uuid,boolean,text,jsonb,text[]),public.moderate_catalog(uuid,integer,boolean,text,uuid) from public,anon;
grant execute on function public.submit_catalog(jsonb,text[],uuid,integer),public.publish_catalog_submission(uuid),public.review_catalog(uuid,boolean,text,jsonb,text[]),public.moderate_catalog(uuid,integer,boolean,text,uuid) to authenticated;

create function public.catalog_duplicates(p_title text,p_category text,p_format text,p_year integer default null)
returns table(id uuid,title text,category text,format text,release_year integer)
language sql stable security invoker set search_path='' as $$
 select s.id,s.title,s.category,s.format,s.release_year from public.series s
 where not s.hidden and s.category=p_category and s.format=p_format
 and (p_year is null or s.release_year is null or s.release_year=p_year)
 and length(trim(p_title))>=2
 and strpos(lower(regexp_replace(trim(s.title),'\s+',' ','g')),lower(regexp_replace(trim(left(p_title,300)),'\s+',' ','g')))>0
 order by s.title,s.id limit 24
$$;
grant execute on function public.catalog_duplicates(text,text,text,integer) to authenticated;
