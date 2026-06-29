# Supabase setup

Database changes are managed as **CLI migrations** in `supabase/migrations/`.
Each migration is a timestamped, version-controlled SQL file; `supabase db push`
applies any that haven't run yet on the linked project and records them in the
remote `supabase_migrations.schema_migrations` table. Re-running is safe — already
applied migrations are skipped.

## One-time setup

The Supabase CLI is not installed on this machine. Install it, then initialize
and link this repo to the project:

```bash
# 1. Install the CLI (macOS / Homebrew)
brew install supabase/tap/supabase

# 2. Generate config.toml for your CLI version (won't touch existing migrations)
supabase init

# 3. Authenticate (opens a browser to create an access token)
supabase login

# 4. Link this repo to the TokuDex project (asks for the database password)
supabase link --project-ref vjdbddflaiuogawqggav
```

`vjdbddflaiuogawqggav` is the project ref from `NEXT_PUBLIC_SUPABASE_URL`.

## Apply migrations

```bash
supabase db push          # apply pending migrations to the linked (remote) project
supabase migration list   # see local vs remote applied state
```

> **The app is not safe to ship until the RLS migration is applied** — the anon
> key is public and the client can hit the REST API directly, so RLS is the only
> thing enforcing per-user data isolation.

## Adding future migrations

```bash
supabase migration new <name>          # creates supabase/migrations/<timestamp>_<name>.sql
# ...edit the generated file...
supabase db push                       # apply it
```

Write migrations to be idempotent where practical (e.g. `drop policy if exists`
before `create policy`, as the RLS migration does) so they survive re-runs and
`supabase db reset`.

## Current migrations

- `*_enable_rls_policies.sql` — enables RLS on all four tables; `series`/`episodes`
  are public-read, `user_series_progress`/`episode_notes` are owner-only
  (`auth.uid() = user_id`). Verification queries are in the file's footer.

## Required environment variables

| Var | Where | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | anon key (public; safe with RLS on) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | admin key for account deletion (`auth.admin.deleteUser`). **Never expose to the browser.** Add to `.env.local` and to Vercel project env. |

Get the keys from Supabase → Settings → API. Without `SUPABASE_SERVICE_ROLE_KEY`,
the "Delete account" action on `/account` will fail with a clear error.

## Seeding catalog data & recaps

`series` and `episodes` are read-only for clients (per RLS). Maintain catalog rows
from the Supabase dashboard, the **service role** key, or `supabase/seed.sql`
(idempotent; runs on `supabase db reset`).

**The recap content is the product's differentiator**, so treat it as real work:

- `episodes.synopsis` is the "what happened in this episode" recap the app shows.
  Source it from official guides / Fandom / Wikipedia and **verify** — do not ship
  machine-invented plot summaries as canonical.
- `series.synopsis` is the short series description.
- `episode_notes` is the *user's* private recap (written via the check-in modal) —
  separate from the catalog synopsis.

`seed.sql` has copy-paste-able idempotent patterns for adding series and episodes.

### Bulk-import episodes from a CSV

Use `scripts/import-episodes.mjs` to load a whole series' episodes (with recaps).
CSV header columns: `episode_number,title,synopsis,air_date` (`synopsis` is the recap;
`air_date` is `YYYY-MM-DD`; both optional). See `scripts/episodes.sample.csv`.

```bash
# 1) Generate idempotent SQL to review, then run it in the Supabase SQL editor:
npm run import:episodes -- --series "Kamen Rider Kuuga" --file path/to/episodes.csv --out supabase/kuuga.sql

# 2) Or apply directly via the service-role key (reads .env.local automatically):
npm run import:episodes -- --series "Kamen Rider Kuuga" --file path/to/episodes.csv --push

# Match by id instead of title with --series-id <uuid>.
```

The import upserts on `(series_id, episode_number)`, so re-running updates rows
rather than duplicating. It validates episode numbers / dates and warns on empty
recaps. The series must already exist (add it first via `seed.sql` or the dashboard).
