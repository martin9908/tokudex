-- TokuDex — referrals
-- ---------------------------------------------------------------------------
-- Referral/invite loop. Each user gets one opaque referral code; when a new
-- user signs up with a ?ref=<code> cookie present, we record one attribution
-- row (at most one per referred user). Referrers earn a "Recruiter" achievement.
--
-- Attribution rows are written server-side with the service-role client (the
-- referred user isn't the referrer, so RLS can't authorize that insert). Reads
-- are owner-scoped so a user can see their own code + recruit count only.
--
-- Idempotent: safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists public.referral_codes (
  user_id uuid not null,
  code text not null,
  created_at timestamptz not null default now(),
  constraint referral_codes_pkey primary key (user_id),
  constraint referral_codes_code_unique unique (code),
  constraint referral_codes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

alter table public.referral_codes enable row level security;

drop policy if exists "referral_codes_select_own" on public.referral_codes;
create policy "referral_codes_select_own"
  on public.referral_codes
  for select
  using (auth.uid() = user_id);

drop policy if exists "referral_codes_insert_own" on public.referral_codes;
create policy "referral_codes_insert_own"
  on public.referral_codes
  for insert
  with check (auth.uid() = user_id);

create table if not exists public.referrals (
  id uuid not null default gen_random_uuid (),
  referrer_id uuid not null,
  referred_id uuid not null,
  code text not null,
  created_at timestamptz not null default now(),
  constraint referrals_pkey primary key (id),
  -- A user can be attributed to at most one referrer, ever.
  constraint referrals_referred_unique unique (referred_id),
  constraint referrals_referrer_fkey foreign KEY (referrer_id) references auth.users (id) on delete CASCADE,
  constraint referrals_referred_fkey foreign KEY (referred_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

alter table public.referrals enable row level security;

-- Referrer can read their own recruits (for the invite page + Recruiter badge).
-- No client insert policy: attribution is written via the service-role client.
drop policy if exists "referrals_select_own" on public.referrals;
create policy "referrals_select_own"
  on public.referrals
  for select
  using (auth.uid() = referrer_id);
