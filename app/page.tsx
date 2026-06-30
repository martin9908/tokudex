import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogEpisodeButton from "./components/LogEpisodeButton";
import SupportLink from "./components/SupportLink";
import Achievements from "./components/Achievements";
import FranchiseAchievements from "./components/FranchiseAchievements";
import tokudexIcon from "../assets/tokudex_icon.png";
import tokudexLogo from "../assets/tokudex_logo.png";

type WatchItem = {
  progress: {
    id: string;
    current_episode: number;
    status: string;
    last_watched_at: string;
  };
  series: {
    id: string;
    title: string;
    franchise: string | null;
    total_episodes: number | null;
    cover_image_url: string | null;
    copyright_notice: string | null;
  };
};

export default async function Home() {
  const client = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await client.auth.getUser();

  const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  const displayName = fullName || user?.email?.split("@")[0] || "there";

  let watchItems: WatchItem[] = [];
  let loadError = false;
  const stats = {
    watching: 0,
    completed: 0,
    on_hold: 0,
    plan_to_watch: 0,
  };

  if (user) {
    // Get user's progress with series details
    const { data: progressData, error: progressError } = await client
      .from("user_series_progress")
      .select("*, series(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (progressError) {
      loadError = true;
    } else if (progressData) {
      watchItems = progressData
        .map((entry: typeof progressData[0]) => ({
          progress: {
            id: entry.id,
            current_episode: entry.current_episode,
            status: entry.status,
            last_watched_at: entry.last_watched_at,
          },
          series: {
            id: entry.series.id,
            title: entry.series.title,
            franchise: entry.series.franchise,
            total_episodes: entry.series.total_episodes,
            cover_image_url: entry.series.cover_image_url,
            copyright_notice: entry.series.copyright_notice,
          },
        }))
        .filter((item: WatchItem) => item.series);

      // Count by status
      progressData.forEach((entry: typeof progressData[0]) => {
        switch (entry.status) {
          case "watching":
            stats.watching++;
            break;
          case "completed":
            stats.completed++;
            break;
          case "on_hold":
            stats.on_hold++;
            break;
          case "plan_to_watch":
            stats.plan_to_watch++;
            break;
        }
      });
    }
  }

  // Continue Tracking = series actively in progress; Recently Updated = any
  // series by most recent activity (watchItems is already ordered by updated_at).
  const featured = watchItems
    .filter((item) => item.progress.status === "watching")
    .slice(0, 3);
  const recentlyUpdated = watchItems.slice(0, 5);
  const primaryItem = watchItems[0];

  // Tracker Summary aggregates + the most-recent series for a quick resume.
  const totalTracked = watchItems.length;
  const episodesLogged = watchItems.reduce(
    (sum, item) => sum + (item.progress.current_episode || 0),
    0
  );
  const primaryTotal = primaryItem?.series.total_episodes || 0;
  const primaryCurrent = primaryItem?.progress.current_episode || 0;
  const primaryPct = primaryTotal ? Math.round((primaryCurrent / primaryTotal) * 100) : 0;
  const primaryNext = Math.min(primaryCurrent + 1, primaryTotal || primaryCurrent + 1);
  const primaryHasNext = !!primaryItem && primaryCurrent < (primaryTotal || Infinity);

  const completedSeries = watchItems
    .filter((item) => item.progress.status === "completed")
    .map((item) => ({ title: item.series.title, franchise: item.series.franchise }));

  return (
    <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <aside className="hidden lg:flex flex-col rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl p-4 min-h-[760px]">
          <div className="mb-5">
            <Image src={tokudexLogo} alt="TokuDex" className="h-8 w-auto" />
          </div>
          <nav className="space-y-1 text-sm">
            {[
              { label: "Home", href: "/", active: true },
              { label: "Series", href: "/series", active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2.5 transition-colors ${item.active
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-600/30"
                  : "text-cyan-100/70 hover:bg-cyan-500/10 hover:text-cyan-100"
                  }`}
              >
                {item.label}
              </Link>
            ))}
            {["Watchlist", "Calendar", "Explore"].map((label) => (
              <div
                key={label}
                aria-disabled
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-cyan-100/35"
              >
                {label}
                <span className="rounded-full border border-cyan-900/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan-200/45">
                  Soon
                </span>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-xl border border-cyan-900/50 bg-[#071a2d]/70 p-3 flex items-center gap-2">
              <div className="h-10 w-10 rounded-full border border-cyan-700/40 bg-[#08192a] flex items-center justify-center">
                <Image src={tokudexIcon} alt="Profile" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-cyan-100">{displayName}</p>
                <p className="truncate text-xs text-cyan-200/75">{user?.email ?? "View Profile"}</p>
              </div>
            </div>
            <div className="rounded-xl border border-cyan-900/50 bg-[#061626]/80 p-4 text-cyan-100/90">
              <p className="text-2xl leading-relaxed">
                Remember.
                <br />
                Track.
                <br />
                Continue.
              </p>
            </div>
            <SupportLink
              label="☕ Support TokuDex"
              className="tdx-focus-ring flex items-center justify-center rounded-xl border border-cyan-900/50 bg-[#081a2b]/70 px-3 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-500/10 transition-colors"
            />
          </div>
        </aside>

        <main className="space-y-4">
          <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl p-4 md:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {displayName}!</h1>
                <p className="text-cyan-200/70 mt-1">
                  Pick up where you left off. TokuDex tracks the tokusatsu you&apos;re watching — it doesn&apos;t stream them.
                </p>
              </div>
              <form action="/series" method="get" className="hidden md:block w-64">
                <input
                  type="search"
                  name="q"
                  aria-label="Search series"
                  placeholder="Search series..."
                  className="w-full rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/40 outline-none focus:ring-2 focus:ring-cyan-500/60"
                />
              </form>
            </div>

            <h2 className="text-xl font-semibold mb-3">Continue Tracking</h2>
            {loadError ? (
              <p className="rounded-xl border border-red-900/45 bg-red-500/10 p-4 text-sm text-red-300">
                We couldn&apos;t load your tracker right now. Please refresh to try again.
              </p>
            ) : watchItems.length === 0 ? (
              <div className="rounded-xl border border-cyan-900/45 bg-[#081a2b]/60 p-5">
                <p className="text-base font-semibold text-cyan-100">Welcome to TokuDex 👋</p>
                <p className="text-sm text-cyan-200/75 mt-1 mb-4">
                  Your tokusatsu episode tracker — never lose your place again. Three steps to start:
                </p>
                <ol className="space-y-2.5 text-sm text-cyan-100/85 mb-5">
                  {[
                    "Find a series in the library",
                    "Add it to your tracker",
                    "Log each episode and jot a quick recap",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-semibold text-cyan-300">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Link
                  href="/series"
                  className="tdx-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cyan-500/90 px-5 text-sm font-semibold text-[#031018] hover:bg-cyan-400 transition-colors"
                >
                  Browse the series library →
                </Link>
              </div>
            ) : featured.length === 0 ? (
              <p className="rounded-xl border border-cyan-900/45 bg-[#081a2b]/60 p-4 text-sm text-cyan-100/70">
                Nothing in progress right now — pick one back up from{" "}
                <Link href="/series" className="text-cyan-300 hover:text-cyan-200">
                  your library
                </Link>
                .
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {featured.map(({ progress, series }) => {
                  const pct = Math.round(
                    ((progress.current_episode || 0) / (series.total_episodes || 1)) * 100
                  );
                  const cur = progress.current_episode || 0;
                  const total = series.total_episodes || 0;
                  const next = Math.min(cur + 1, total || cur + 1);
                  const hasNext = cur < (total || Infinity);

                  return (
                    <article
                      key={series.id}
                      className="rounded-xl border border-cyan-900/45 bg-[linear-gradient(145deg,#081b2c,#050d17)] p-3"
                    >
                      <div className="relative aspect-[3/4] rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center mb-3 overflow-hidden">
                        {series.cover_image_url ? (
                          <Image
                            src={series.cover_image_url}
                            alt={series.title}
                            fill
                            sizes="(max-width: 640px) 90vw, 220px"
                            className="object-cover"
                          />
                        ) : (
                          <Image src={tokudexIcon} alt={series.title} className="w-24 h-24 opacity-95" />
                        )}
                      </div>
                      <p className="text-[11px] tracking-[0.25em] text-cyan-200/75 uppercase mb-1">
                        {series.franchise || "Series"}
                      </p>
                      <h3 className="text-xl font-semibold uppercase leading-tight line-clamp-2">
                        {series.title}
                      </h3>
                      <p className="text-sm text-cyan-100/80 mt-1">
                        Episode {progress.current_episode || "1"}
                      </p>
                      <p className="text-sm text-cyan-200/70 mb-2">Tracking</p>
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${pct}% watched`}
                        className="h-1.5 w-full rounded-full bg-cyan-950/80 overflow-hidden mb-2"
                      >
                        <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {hasNext && (
                          <LogEpisodeButton
                            seriesId={series.id}
                            seriesTitle={series.title}
                            episodeNumber={next}
                            className="tdx-focus-ring inline-flex w-full justify-center rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-[#031018] py-2 text-sm font-semibold transition-colors"
                          />
                        )}
                        <Link
                          href={`/series/${series.id}`}
                          className="tdx-focus-ring inline-flex w-full justify-center rounded-lg border border-cyan-900/60 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/10 transition-colors"
                        >
                          Open Tracker
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {primaryItem && (
            <>
          <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl p-4 md:p-5">
            <h2 className="text-2xl font-semibold mb-3">Tracker Summary</h2>
            {primaryItem ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-xl border border-cyan-900/50 bg-[#081a2b]/70 p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-300">{totalTracked}</p>
                    <p className="text-[11px] uppercase tracking-wider text-cyan-200/70">Series</p>
                  </div>
                  <div className="rounded-xl border border-cyan-900/50 bg-[#081a2b]/70 p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-300">{episodesLogged}</p>
                    <p className="text-[11px] uppercase tracking-wider text-cyan-200/70">Episodes</p>
                  </div>
                  <div className="rounded-xl border border-cyan-900/50 bg-[#081a2b]/70 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-300">{stats.completed}</p>
                    <p className="text-[11px] uppercase tracking-wider text-cyan-200/70">Completed</p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cyan-100/80">
                  <span><span className="text-cyan-300 font-semibold">{stats.watching}</span> Watching</span>
                  <span><span className="text-amber-300 font-semibold">{stats.on_hold}</span> On Hold</span>
                  <span><span className="text-slate-300 font-semibold">{stats.plan_to_watch}</span> Plan</span>
                </div>

                <p className="text-xs uppercase tracking-wider text-cyan-200/70 mb-2">Most recent</p>
                <article className="rounded-xl border border-cyan-900/50 bg-[#081a2b]/70 p-3">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center">
                      {primaryItem.series.cover_image_url ? (
                        <Image
                          src={primaryItem.series.cover_image_url}
                          alt={primaryItem.series.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <Image src={tokudexIcon} alt={primaryItem.series.title} className="w-9 h-9" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs tracking-[0.3em] uppercase text-cyan-300/80 mb-1">
                        {primaryItem.series.franchise || "Series"}
                      </p>
                      <p className="text-base font-semibold leading-tight line-clamp-1">
                        {primaryItem.series.title}
                      </p>
                      <p className="text-xs text-cyan-200/75 mt-0.5">
                        Episode {primaryCurrent || 1} of {primaryTotal || "?"} · updated{" "}
                        {new Date(primaryItem.progress.last_watched_at).toLocaleDateString()}
                      </p>
                      <div
                        role="progressbar"
                        aria-valuenow={primaryPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${primaryPct}% watched`}
                        className="h-1.5 w-full rounded-full bg-cyan-950/80 overflow-hidden mt-2"
                      >
                        <div className="h-full bg-cyan-400" style={{ width: `${primaryPct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {primaryHasNext && (
                      <LogEpisodeButton
                        seriesId={primaryItem.series.id}
                        seriesTitle={primaryItem.series.title}
                        episodeNumber={primaryNext}
                        className="tdx-focus-ring flex-1 min-w-[140px] min-h-[40px] inline-flex items-center justify-center rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-[#031018] px-3 text-sm font-semibold transition-colors"
                      />
                    )}
                    <Link
                      href={`/series/${primaryItem.series.id}`}
                      className="tdx-focus-ring flex-1 min-w-[140px] min-h-[40px] inline-flex items-center justify-center rounded-lg border border-cyan-900/60 px-3 text-sm font-medium text-cyan-100 hover:bg-cyan-500/10 transition-colors"
                    >
                      Open Tracker
                    </Link>
                  </div>
                </article>
              </>
            ) : (
              <p className="text-cyan-100/70">No tracked series yet.{" "}
                <Link href="/series" className="text-cyan-300 hover:text-cyan-200">Browse the library</Link>{" "}
                to start tracking.
              </p>
            )}
          </section>

          <Achievements
            seriesTracked={totalTracked}
            episodesLogged={episodesLogged}
            seriesCompleted={stats.completed}
          />

          <FranchiseAchievements completed={completedSeries} />

          <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-semibold">Recently Updated</h2>
              <Link href="/series" className="text-sm text-cyan-300 hover:text-cyan-200">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {recentlyUpdated.map(({ progress, series }) => {
                const pct = Math.round(
                  ((progress.current_episode || 0) / (series.total_episodes || 1)) * 100
                );
                return (
                  <Link
                    key={series.id}
                    href={`/series/${series.id}`}
                    className="tdx-focus-ring rounded-xl border border-cyan-900/45 bg-[#081a2b]/80 p-2.5 hover:border-cyan-700/45 transition-colors"
                  >
                    <div className="relative aspect-[3/4] rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center mb-2 overflow-hidden">
                      {series.cover_image_url ? (
                        <Image
                          src={series.cover_image_url}
                          alt={series.title}
                          fill
                          sizes="(max-width: 768px) 45vw, 180px"
                          className="object-cover"
                        />
                      ) : (
                        <Image src={tokudexIcon} alt={series.title} className="w-14 h-14" />
                      )}
                    </div>
                    <p className="text-sm font-medium leading-tight mb-1">{series.title}</p>
                    <p className="text-xs text-cyan-200/70 mb-2">Episode {progress.current_episode || "1"}</p>
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${pct}% watched`}
                      className="h-1.5 w-full rounded-full bg-cyan-950/80 overflow-hidden"
                    >
                      <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
