import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  let watchItems: WatchItem[] = [];
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

    if (!progressError && progressData) {
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

  const featured = watchItems.slice(0, 3);
  const recentlyUpdated = watchItems.slice(0, 5);
  const primaryItem = watchItems[0];

  const upcoming = featured.map((item, index) => ({
    ...item,
    nextEpisode: Math.min(
      (item.progress.current_episode || 0) + 1,
      item.series.total_episodes || 1
    ),
    dateLabel: index === 0 ? "Today" : index === 1 ? "Tomorrow" : "May 16",
    timeLabel: "9:00 AM",
  }));

  return (
    <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_290px] gap-4">
        <aside className="hidden lg:flex flex-col rounded-2xl border border-cyan-900/45 bg-[#061321]/75 backdrop-blur-xl p-4 min-h-[760px]">
          <div className="mb-5">
            <Image src={tokudexLogo} alt="TokuDex" className="h-8 w-auto" />
          </div>
          <nav className="space-y-1 text-sm">
            {[
              { label: "Home", active: true },
              { label: "Series", active: false },
              { label: "Watchlist", active: false },
              { label: "Calendar", active: false },
              { label: "Explore", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg px-3 py-2.5 ${item.active
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-600/30"
                  : "text-cyan-100/70"
                  }`}
              >
                {item.label}
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-xl border border-cyan-900/50 bg-[#071a2d]/70 p-3 flex items-center gap-2">
              <div className="h-10 w-10 rounded-full border border-cyan-700/40 bg-[#08192a] flex items-center justify-center">
                <Image src={tokudexIcon} alt="Profile" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cyan-100">Shin K.</p>
                <p className="text-xs text-cyan-200/60">View Profile</p>
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
          </div>
        </aside>

        <main className="space-y-4">
          <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 backdrop-blur-xl p-4 md:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, Shin!</h1>
                <p className="text-cyan-200/70 mt-1">Update your progress and continue your guide.</p>
              </div>
              <div className="hidden md:block w-64">
                <input
                  type="search"
                  placeholder="Search series..."
                  className="w-full rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/40 outline-none"
                />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-3">Continue Tracking</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {featured.map(({ progress, series }) => {
                const pct = Math.round(
                  ((progress.current_episode || 0) / (series.total_episodes || 1)) * 100
                );

                return (
                  <article
                    key={series.id}
                    className="rounded-xl border border-cyan-900/45 bg-[linear-gradient(145deg,#081b2c,#050d17)] p-3"
                  >
                    <div className="aspect-[4/3] rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center mb-3">
                      {series.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={series.cover_image_url}
                          alt={series.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image src={tokudexIcon} alt={series.title} className="w-24 h-24 opacity-95" />
                      )}
                    </div>
                    <p className="text-[11px] tracking-[0.25em] text-cyan-200/60 uppercase mb-1">
                      {series.franchise || "Series"}
                    </p>
                    <h3 className="text-2xl font-semibold uppercase leading-tight">
                      {series.title.split(" ").slice(-1)}
                    </h3>
                    <p className="text-sm text-cyan-100/80 mt-1">
                      Episode {progress.current_episode || "1"}
                    </p>
                    <p className="text-sm text-cyan-200/70 mb-2">Tracking</p>
                    <div className="h-1.5 w-full rounded-full bg-cyan-950/80 overflow-hidden mb-2">
                      <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                    <Link
                      href={`/series/${series.id}`}
                      className="mt-2 inline-flex w-full justify-center rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-[#031018] py-2 text-sm font-semibold transition-colors"
                    >
                      Open Tracker
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 backdrop-blur-xl p-4 md:p-5">
            <h2 className="text-2xl font-semibold mb-3">Tracker Summary</h2>
            {primaryItem ? (
              <article className="rounded-xl border border-cyan-900/50 bg-[#07182a]/80 p-3">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center shrink-0">
                    <Image src={tokudexIcon} alt={primaryItem.series.title} className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs tracking-[0.3em] uppercase text-red-400/90 mb-1">
                      {primaryItem.series.franchise || "Series"}
                    </p>
                    <p className="text-lg font-semibold mb-1">Episode {primaryItem.progress.current_episode || "1"}</p>
                    <p className="text-xs text-cyan-200/60">
                      Last updated: {new Date(primaryItem.progress.last_watched_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </article>
            ) : (
              <p className="text-cyan-100/70">No tracked series yet. Start tracking to see updates here.</p>
            )}
          </section>

          <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 backdrop-blur-xl p-4 md:p-5">
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
                    className="rounded-xl border border-cyan-900/45 bg-[#081a2b]/80 p-2.5 hover:border-cyan-700/45 transition-colors"
                  >
                    <div className="aspect-[4/3] rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center mb-2">
                      {series.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={series.cover_image_url}
                          alt={series.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image src={tokudexIcon} alt={series.title} className="w-14 h-14" />
                      )}
                    </div>
                    <p className="text-sm font-medium leading-tight mb-1">{series.title}</p>
                    <p className="text-xs text-cyan-200/70 mb-2">Episode {progress.current_episode || "1"}</p>
                    <div className="h-1.5 w-full rounded-full bg-cyan-950/80 overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 backdrop-blur-xl p-4 md:p-5">
            <h2 className="text-2xl font-semibold mb-3">Quick Stats</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-cyan-100/80">Tracking</span>
                <span className="text-2xl font-semibold">{stats.watching}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-cyan-100/80">Completed</span>
                <span className="text-2xl font-semibold">{stats.completed}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-cyan-100/80">On Hold</span>
                <span className="text-2xl font-semibold">{stats.on_hold}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-cyan-100/80">Plan to Watch</span>
                <span className="text-2xl font-semibold">{stats.plan_to_watch}</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 backdrop-blur-xl p-4 md:p-5">
            <h2 className="text-2xl font-semibold mb-3">Upcoming Episodes</h2>
            <ul className="space-y-3">
              {upcoming.map(({ series, nextEpisode, dateLabel, timeLabel }) => (
                <li key={series.id} className="rounded-xl border border-cyan-900/45 bg-[#081a2b]/70 p-2.5 flex items-center gap-3">
                  <div className="h-14 w-14 rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center shrink-0">
                    {series.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={series.cover_image_url}
                        alt={series.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image src={tokudexIcon} alt={series.title} className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{series.title}</p>
                    <p className="text-xs text-cyan-200/75">Episode {nextEpisode}</p>
                    <p className="text-xs text-cyan-300/60">{dateLabel} · {timeLabel}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/series" className="inline-flex mt-4 text-sm text-cyan-300 hover:text-cyan-200">View Calendar</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
