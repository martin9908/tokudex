-- Keep activity as each member's own watch history (the home page's year chart)
-- while the public feed still shows only the last 90 days, and only for members
-- who share. Additive: no rows are dropped.
--
-- Before this, the trigger skipped members who don't share (or have no profile)
-- and purged every row older than 90 days, so a year of history never existed.
-- Rows are now always written and sharing is enforced when the feed is read,
-- which also hides a member's past rows as soon as they switch sharing off.

-- Episodes a row covers: logging 3 → 10 in one go is one row worth 7.
alter table public.activity add column episodes integer check(episodes >= 0);

drop policy activity_read on public.activity;
create policy activity_read on public.activity for select using(
 created_at > now() - interval '90 days'
 and exists(select 1 from public.profiles p where p.user_id=activity.user_id and p.share_activity)
 and exists(select 1 from public.series s where s.id=series_id and not s.hidden)
);
create policy activity_read_own on public.activity for select using(user_id=auth.uid());
create index activity_by_user_kind on public.activity(user_id,kind,created_at);

create or replace function public.activity_from_progress() returns trigger language plpgsql security definer set search_path='' as $$
declare kind text; item public.series; before integer;
begin
 before := case when tg_op='INSERT' then 0 else coalesce(old.current_episode,0) end;
 select * into item from public.series where id=new.series_id;
 if tg_op='UPDATE' and old.status is distinct from new.status and new.status='completed' then kind:='finished';
 elsif tg_op='INSERT' and new.status='completed' then kind:='finished';
 elsif tg_op='UPDATE' and old.status is distinct from new.status and new.status='on_hold' then kind:='shelved';
 elsif new.current_episode > 0 and new.current_episode > before then kind:='logged';
 else return new; end if;
 if kind='logged' and item.format='movie' then kind:='finished'; end if;
 insert into public.activity(user_id,kind,series_id,episode,episodes)
 values(new.user_id,kind,new.series_id,new.current_episode,greatest(coalesce(new.current_episode,0)-before,0));
 return new;
end $$;
