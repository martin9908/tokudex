# TokuDex

> Remember. Track. Continue.

A modern tokusatsu (Japanese live-action special effects) episode tracker built with [Next.js](https://nextjs.org) and [Capacitor](https://capacitorjs.com). Track your progress across Super Sentai, Ultraman, and other tokusatsu series with a clean, responsive interface.

## Features

- 📺 **Episode Tracking** — Log watched episodes with optional recap notes
- 📱 **Responsive UI** — Optimized for mobile, tablet, and desktop screens
- 🔔 **Progress Tracking** — Visual progress bars and episode counts per series
- 🎬 **Series Library** — Browse curated tokusatsu series catalog
- 🔐 **Supabase Auth** — Secure account management
- 📲 **Native Apps** — iOS and Android apps via Capacitor
- 🌙 **Dark Theme** — Eye-friendly cyan/dark color scheme

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Mobile**: Capacitor 8 (iOS + Android)
- **Deployment**: Vercel (web), native app stores (iOS/Android)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (free tier available)
- Xcode (macOS, for iOS development)
- Android Studio (for Android development)

### Setup

1. **Clone and install**:
   ```bash
   git clone <repo-url>
   cd mytokutracker
   npm install
   ```

2. **Environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Building & Deployment

**Web (Vercel)**:
```bash
npm run build
npm run start
```

**Native Apps (Capacitor)**:
```bash
# Build Next.js first
npm run build

# Sync web assets to native projects
npm run cap:sync

# Open iOS project
npm run cap:ios

# Open Android project
npm run cap:android
```

For remote app loading in native shells, set the environment variable before syncing:
```bash
export CAPACITOR_SERVER_URL=https://your-deployed-app.vercel.app
npm run cap:sync
```

## Project Structure

```
.
├── app/                       # Next.js App Router
│   ├── api/                   # API routes (series, notes, progress)
│   ├── components/            # Reusable React components
│   │   ├── EpisodeList.tsx
│   │   ├── EpisodeCheckInModal.tsx
│   │   ├── LogEpisodeButton.tsx
│   │   ├── Navbar.tsx
│   │   └── MobileTabBar.tsx
│   ├── series/                # Series detail page
│   ├── watch/                 # Episode logging page
│   └── styles/                # Global styles & tokens
├── lib/                       # Utilities
│   ├── supabase/              # Supabase client & queries
│   └── validation.ts          # Input validation
├── ios/                       # Native iOS project (Xcode)
├── android/                   # Native Android project (Gradle)
├── capacitor.config.ts        # Capacitor configuration
└── public/                    # Static assets & fallback HTML
```

## Episode Logging

Users can log episodes in two ways:

1. **Quick modal popup** — Click "Log Episode" or tap an episode in the list
2. **Episode list interaction** — Tap episodes to mark watched/unwatched (old behavior preserved)

Notes and status are saved in Supabase with optional recap text.

## iOS Safe-Area Handling

Notch and home-indicator areas are properly handled to avoid black bars:

- Navbar applies top safe-inset padding
- Mobile tab bar applies bottom safe-inset padding
- Viewport is set to `viewport-fit: cover` for edge-to-edge rendering

## API Routes

- `GET/POST /api/series` — Series catalog
- `GET/POST /api/progress` — User watch progress
- `GET/POST /api/notes` — Episode recap notes

All endpoints require Supabase authentication.

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript strict mode
- Components are properly typed
- Tests pass before submitting PRs

## License

MIT — Feel free to use for personal or educational purposes.

## Support

For issues, feature requests, or feedback, please open an issue on GitHub or contact the maintainer.
