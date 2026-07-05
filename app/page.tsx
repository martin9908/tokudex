import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProgressBySeries } from "@/lib/supabase/queries";
import { getReferralCount } from "@/lib/referrals";
import { toWatchItems, summarizeProgress, watchedPercent, type WatchItem } from "@/lib/progress";
import { LinkButton, PosterImage, ProgressBar, buttonClasses } from "./components/atoms";
import LogEpisodeButton from "./components/organisms/LogEpisodeButton";
import SupportBanner from "./components/molecules/SupportBanner";
import Achievements from "./components/organisms/Achievements";
import FranchiseAchievements from "./components/organisms/FranchiseAchievements";
import GuestHome from "./components/organisms/GuestHome";
import JsonLd from "./components/JsonLd";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";

const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: absoluteUrl("/series?q={search_term_string}"),
        },
        "query-input": "required name=search_term_string",
    },
};

export default async function Home() {
    const client = await createClient();

    const {
        data: { user },
    } = await client.auth.getUser();

    // Guests (no account) get a read-only preview instead of the tracker home.
    if (!user) {
        return (
            <>
                <JsonLd data={websiteJsonLd} />
                <GuestHome />
            </>
        );
    }

    const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
    const displayName = fullName || user.email?.split("@")[0] || "there";

    let watchItems: WatchItem[] = [];
    let stats = summarizeProgress([]);
    let loadError = false;

    try {
        const rows = await getUserProgressBySeries(user.id);
        watchItems = toWatchItems(rows);
        stats = summarizeProgress(rows);
    } catch {
        loadError = true;
    }

    // Continue Tracking = series actively in progress; Recently Updated = any
    // series by most recent activity (rows are already ordered by updated_at).
    const featured = watchItems.filter((item) => item.progress.status === "watching").slice(0, 3);
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
    const primaryPct = watchedPercent(primaryCurrent, primaryTotal);
    const primaryNext = Math.min(primaryCurrent + 1, primaryTotal || primaryCurrent + 1);
    const primaryHasNext = !!primaryItem && primaryCurrent < (primaryTotal || Infinity);

    const completedSeries = watchItems
        .filter((item) => item.progress.status === "completed")
        .map((item) => ({ title: item.series.title, franchise: item.series.franchise }));

    const referralCount = await getReferralCount(user.id);

    return (
        <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10">
            <JsonLd data={websiteJsonLd} />
            <main className="space-y-4">
                <section className="tdx-panel p-4 md:p-5">
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
                                className="tdx-field px-3 py-2.5"
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
                            <LinkButton href="/series">Browse the series library →</LinkButton>
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
                                const cur = progress.current_episode || 0;
                                const total = series.total_episodes || 0;
                                const next = Math.min(cur + 1, total || cur + 1);
                                const hasNext = cur < (total || Infinity);

                                return (
                                    <article
                                        key={series.id}
                                        className="rounded-xl border border-cyan-900/45 bg-[linear-gradient(145deg,#081b2c,#050d17)] p-3"
                                    >
                                        <div className="relative aspect-[3/4] rounded-lg border border-cyan-900/50 bg-[#091a2b] mb-3 overflow-hidden">
                                            <PosterImage
                                                src={series.cover_image_url}
                                                alt={series.title}
                                                sizes="(max-width: 640px) 90vw, 220px"
                                                iconClassName="h-24 w-24 opacity-95"
                                            />
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
                                        <ProgressBar
                                            value={cur}
                                            max={total || 1}
                                            size="sm"
                                            label={`${watchedPercent(cur, total)}% watched`}
                                            className="mb-2"
                                        />
                                        <div className="mt-2 flex flex-col gap-2">
                                            {hasNext && (
                                                <LogEpisodeButton
                                                    seriesId={series.id}
                                                    seriesTitle={series.title}
                                                    episodeNumber={next}
                                                    className={buttonClasses({ variant: "primary", full: true })}
                                                />
                                            )}
                                            <LinkButton href={`/series/${series.id}`} variant="secondary" full>
                                                Open Tracker
                                            </LinkButton>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {primaryItem && (
                    <>
                        <section className="tdx-panel p-4 md:p-5">
                            <h2 className="text-2xl font-semibold mb-3">Tracker Summary</h2>
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
                                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-cyan-900/50 bg-[#091a2b]">
                                        <PosterImage
                                            src={primaryItem.series.cover_image_url}
                                            alt={primaryItem.series.title}
                                            sizes="64px"
                                            iconClassName="h-9 w-9"
                                        />
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
                                        <ProgressBar
                                            value={primaryCurrent}
                                            max={primaryTotal || 1}
                                            size="sm"
                                            label={`${primaryPct}% watched`}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {primaryHasNext && (
                                        <LogEpisodeButton
                                            seriesId={primaryItem.series.id}
                                            seriesTitle={primaryItem.series.title}
                                            episodeNumber={primaryNext}
                                            className={buttonClasses({ variant: "primary", className: "flex-1 min-w-[140px]" })}
                                        />
                                    )}
                                    <LinkButton
                                        href={`/series/${primaryItem.series.id}`}
                                        variant="secondary"
                                        className="flex-1 min-w-[140px]"
                                    >
                                        Open Tracker
                                    </LinkButton>
                                </div>
                            </article>
                        </section>

                        <Achievements
                            seriesTracked={totalTracked}
                            episodesLogged={episodesLogged}
                            seriesCompleted={stats.completed}
                            referralCount={referralCount}
                        />

                        <FranchiseAchievements completed={completedSeries} />

                        <section className="tdx-panel p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-2xl font-semibold">Recently Updated</h2>
                                <Link href="/series" className="text-sm text-cyan-300 hover:text-cyan-200">View All</Link>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                                {recentlyUpdated.map(({ progress, series }) => (
                                    <Link
                                        key={series.id}
                                        href={`/series/${series.id}`}
                                        className="tdx-focus-ring rounded-xl border border-cyan-900/45 bg-[#081a2b]/80 p-2.5 hover:border-cyan-700/45 transition-colors"
                                    >
                                        <div className="relative aspect-[3/4] rounded-lg border border-cyan-900/50 bg-[#091a2b] mb-2 overflow-hidden">
                                            <PosterImage
                                                src={series.cover_image_url}
                                                alt={series.title}
                                                sizes="(max-width: 768px) 45vw, 180px"
                                                iconClassName="h-14 w-14"
                                            />
                                        </div>
                                        <p className="text-sm font-medium leading-tight mb-1">{series.title}</p>
                                        <p className="text-xs text-cyan-200/70 mb-2">Episode {progress.current_episode || "1"}</p>
                                        <ProgressBar
                                            value={progress.current_episode || 0}
                                            max={series.total_episodes || 1}
                                            size="sm"
                                            label={`${watchedPercent(progress.current_episode, series.total_episodes)}% watched`}
                                        />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                <SupportBanner />
            </main>
        </div>
    );
}
