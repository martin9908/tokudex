-- Members can see their own daily submission attempt count, so the
-- submission form can show "N of your 10 submissions today". Additive only.
create policy attempts_read on public.catalog_attempts for select using(user_id=auth.uid());
