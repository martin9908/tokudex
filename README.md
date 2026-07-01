# TokuDex — Tokusatsu Episode Tracker

> Remember. Track. Continue.

A mobile-first tokusatsu (Japanese live-action superhero) **episode tracker** — it
remembers which episode you're on and what happened last, so you can resume any
series in seconds. It tracks; it doesn't stream.

**Live:** https://tokudex.vercel.app

## Features

**Tracking & recaps**
- 📺 **Episode check-in** — log an episode with a status and an optional personal recap note, via a popup modal
- ⚡ **Quick mark-watched** — one-tap mark/unmark per episode in the list
- 📖 **Episode recaps** — official "what happened" synopsis shown in the check-in modal
- ⏱️ **"Where you left off"** — the current episode's recap surfaced on each series page (the core 10-second resume)
- 📊 **Progress** — per-series progress bars, episode counts, and status (watching / completed / on hold / plan to watch)

**Catalog**
- 🎬 **~2,247 episodes across 50 series** — every Kamen Rider, Super Sentai, and Ultraman series in the catalog, with real episode titles + air dates (sourced from Wikipedia/TMDB)
- 🔎 **Series library** — search + franchise filter
- 🖼️ **Cover art** via Supabase Storage, optimized with `next/image`

**Gamification** (single-player, no audience needed)
- 🎖️ **Ranks** — themed progression by episodes logged (Rookie → Tokusatsu Master → …)
- 🏅 **Milestones** — "First Steps", "Centurion", "Completionist", etc.
- 🏆 **Franchise trophies** — count-based + curated sets ("Destroyer of Worlds" = all Heisei Phase 1 Riders, "Forever Red" = all anniversary Sentai, "Tokusatsu Trifecta", …)
- ✨ **Per-series flavor badges** — "A New Hero" (Kuuga), "Hard-Boiled" (W), etc.
- 🔔 **Unlock toasts** + a dedicated **/achievements** page with earned dates (persisted server-side)

**Access & accounts**
- 👤 **Guest / demo mode** — browse the latest series per franchise read-only, with a grayed-out gamification teaser, to entice sign-up
- 🔐 **Supabase Auth** — email/password sign-up, email confirm, password reset, change name/password, and full account deletion
- 🛡️ **Row Level Security** — every user's progress and notes are DB-enforced private
- 📈 **Analytics** — Vercel Web Analytics
- 📱 **Responsive, dark-first UI** with an accessible cyan/navy design system

## Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth + Storage), Row Level Security
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase project (free tier)

### Setup
1. **Install**
   ```bash
   git clone <repo-url> && cd mytokutracker && npm install
   ```
2. **Environment** — `cp .env.example .env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role secret>   # server-only; used for account deletion
   NEXT_PUBLIC_KOFI_URL=                              # optional; shows a "Support" link when set
   ```
   > `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — never expose it to the client. `NEXT_PUBLIC_*` are inlined at build time.
3. **Database** — apply the migrations (RLS policies + `user_achievements`). See [`supabase/README.md`](supabase/README.md):
   ```bash
   supabase db push
   ```
4. **Run**
   ```bash
   npm run dev   # http://localhost:3000
   ```

### Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run import:episodes` | Seed a series' episodes from a CSV (see below) |

## Content: seeding episodes

Episode data lives in the DB; per-series CSVs are versioned under `data/episodes/`.
Import (or re-import — it's idempotent) with the CSV importer:

```bash
# generate reviewable SQL:
npm run import:episodes -- --series "Kamen Rider Kuuga" --file data/episodes/kuuga.csv --out out.sql
# or apply directly via the service-role key:
npm run import:episodes -- --series "Kamen Rider Kuuga" --file data/episodes/kuuga.csv --push
```

CSV columns: `episode_number,title,synopsis,air_date`. Series/episodes are public-read;
maintain them from the dashboard, `supabase/seed.sql`, or this importer.

## Project Structure

```
.
├── app/
│   ├── page.tsx                 # Home (member dashboard) + guest home branch
│   ├── login/                   # Tabbed sign in / sign up + password reset
│   ├── account/                 # Profile, change password, delete account
│   ├── achievements/            # Full achievements page
│   ├── series/[id]/             # Series detail (member + guest read-only views)
│   ├── reset-password/, terms/, privacy/
│   ├── api/                     # series, progress, notes route handlers
│   ├── components/              # EpisodeList, EpisodeCheckInModal, Achievements,
│   │                            #   FranchiseAchievements, AchievementToaster,
│   │                            #   GuestHome, Navbar, MobileTabBar, SupportBanner, …
│   └── styles/                  # Design tokens + component classes
├── lib/
│   ├── supabase/                # browser / server / admin clients + queries
│   ├── achievements.ts, franchiseAchievements.ts, seriesBadges.ts, achievementState.ts
│   ├── guest.ts                 # latest-per-franchise guest selection
│   └── validation.ts
├── data/episodes/               # per-series episode CSVs (seed source)
├── scripts/import-episodes.mjs  # CSV → DB importer
├── supabase/                    # migrations (RLS, user_achievements), seed.sql, README
└── proxy.ts                     # auth middleware (Next 16 proxy convention)
```

## API Routes
- `POST /api/progress` — upsert watch progress (validated, auth-required)
- `POST /api/notes` — upsert episode recap note (validated, auth-required)
- `GET /api/series`, `GET /api/series/[id]` — catalog + the caller's progress/notes

Mutations validate input at runtime and are scoped to the authenticated user.

## Security
- **RLS** on all tables: `series`/`episodes` public-read; `user_series_progress`,
  `episode_notes`, `user_achievements` restricted to their owner.
- Server-side auth via `getUser()` in the proxy and every mutation.
- Runtime input validation (`lib/validation.ts`).

## License
MIT — for personal/educational use. Tokusatsu series names, images, and trademarks
belong to their respective rights holders; catalog data is used for identification
and tracking only.
