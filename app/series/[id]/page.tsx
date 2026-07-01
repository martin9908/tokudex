import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import EpisodeList from "../../components/EpisodeList";
import AddSeriesButton from "../../components/AddSeriesButton";
import LogEpisodeButton from "../../components/LogEpisodeButton";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { getGuestSeriesIds } from "@/lib/guest";
import tokudexIcon from "../../../assets/tokudex_icon.png";

type SeriesDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
    const { id } = await params;
    const client = await createClient();

    // Get authenticated user
    const {
        data: { user },
    } = await client.auth.getUser();

    // Series is public catalog data — readable by guests too.
    const { data: series, error: seriesError } = await client
        .from("series")
        .select("*")
        .eq("id", id)
        .single();

    if (seriesError || !series) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 w-full">
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Series not found</h1>
                <p className="text-sm text-cyan-200/70 mb-4">
                    This series is not available yet.
                </p>
                <Link href="/series" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
                    Back to Series Library
                </Link>
            </div>
        );
    }

    // Get episodes (public catalog data)
    const { data: episodes = [] } = await client
        .from("episodes")
        .select("*")
        .eq("series_id", id)
        .order("episode_number", { ascending: true });

    // Guests may view only the latest series per franchise, read-only.
    if (!user) {
        const guestIds = await getGuestSeriesIds();
        if (!guestIds.has(id)) return <LockedSeriesView title={series.title} />;
        return <GuestSeriesDetail series={series} episodes={episodes ?? []} />;
    }

    // Get user progress
    const { data: progress } = await client
        .from("user_series_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("series_id", id)
        .single();

    const isTracking = !!progress;
    const currentEpisode = progress?.current_episode || 0;
    const progressPercent = Math.round(
        (currentEpisode / (series.total_episodes || 1)) * 100
    );
    const nextEpisode = Math.min(currentEpisode + 1, series.total_episodes || 1);
    const hasNext = isTracking && (!series.total_episodes || currentEpisode < series.total_episodes);
    const nextEpisodeData = (episodes ?? []).find((e) => e.episode_number === nextEpisode);
    const lastEpisodeData = (episodes ?? []).find((e) => e.episode_number === currentEpisode);

    return (
        <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10 w-full space-y-4">
            <section className="relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-[#05101d] min-h-[330px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(29,111,158,0.45),transparent_42%),radial-gradient(circle_at_12%_82%,rgba(8,167,212,0.10),transparent_42%),linear-gradient(118deg,#020913_8%,#081b2b_54%,#030912_100%)]" />
                <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_200px] lg:grid-cols-[1fr_220px] gap-6 md:gap-8 items-start">
                    {/* Poster — above the text on mobile, to the right on md+ */}
                    <div className="order-first md:order-last">
                        <div className="relative mx-auto w-[140px] sm:w-[160px] md:w-full md:max-w-[220px]">
                            <div className="absolute inset-0 rounded-2xl bg-cyan-400/15 blur-2xl" />
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-cyan-700/45 bg-[#071321]/75 shadow-[0_18px_50px_rgba(0,0,0,0.42)]">
                                {series.cover_image_url ? (
                                    <Image
                                        src={series.cover_image_url}
                                        alt={series.title}
                                        fill
                                        sizes="(max-width: 768px) 160px, 220px"
                                        className="object-cover object-center"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center p-4">
                                        <Image src={tokudexIcon} alt="" className="w-20 h-20 opacity-85" />
                                    </div>
                                )}
                                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,19,0.08)_0%,rgba(2,9,19,0.18)_60%,rgba(2,9,19,0.38)_100%)]" />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="order-last md:order-first">
                        <p className="text-xs tracking-[0.3em] uppercase text-cyan-300/80 mb-3">
                            {series.franchise || "Series"}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold leading-[0.95] mb-3">
                            {series.title}
                        </h1>
                        <p className="text-cyan-100/80 text-base leading-relaxed max-w-2xl mb-5">
                            {series.synopsis}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cyan-200/75 mb-4">
                            {series.original_run && (
                                <>
                                    <span>{series.original_run}</span>
                                    <span className="opacity-40">|</span>
                                </>
                            )}
                            <span>{series.total_episodes || "?"} Episodes</span>
                            <span
                                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(progress?.status)}`}
                            >
                                {statusLabel(progress?.status)}
                            </span>
                        </div>

                        <div className="max-w-lg mb-5">
                            <div
                                role="progressbar"
                                aria-valuenow={progressPercent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${currentEpisode} of ${series.total_episodes || "?"} episodes tracked`}
                                className="h-2 w-full rounded-full bg-cyan-950/85 overflow-hidden mb-1.5"
                            >
                                <div className="h-full bg-cyan-400" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <p className="text-sm text-cyan-100/70">
                                {currentEpisode} / {series.total_episodes || "?"} episodes tracked
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {isTracking ? (
                                hasNext ? (
                                    <LogEpisodeButton
                                        seriesId={series.id}
                                        seriesTitle={series.title}
                                        episodeNumber={nextEpisode}
                                        episodeTitle={nextEpisodeData?.title ?? null}
                                        episodeSynopsis={nextEpisodeData?.synopsis ?? null}
                                        className="tdx-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-[#031018] px-5 text-sm font-semibold transition-colors"
                                    />
                                ) : (
                                    <span className="inline-flex min-h-[44px] items-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-sm font-medium text-emerald-200">
                                        ✓ Series completed
                                    </span>
                                )
                            ) : (
                                <AddSeriesButton seriesId={series.id} className="min-h-[44px]" />
                            )}
                            <a
                                href="#episode-list"
                                className="tdx-focus-ring rounded-lg text-sm text-cyan-300/85 hover:text-cyan-200"
                            >
                                Browse episodes ↓
                            </a>
                        </div>

                        {!isTracking && (
                            <p className="mt-3 text-xs text-cyan-200/75">
                                Add this series to your tracker, or tap an episode below to start logging.
                            </p>
                        )}

                        <p className="mt-5 max-w-lg text-xs text-cyan-200/60">
                            TokuDex remembers your progress and recaps — it doesn&apos;t stream episodes.
                        </p>
                        {series.copyright_notice && (
                            <p className="mt-4 text-[11px] text-cyan-200/45">
                                {series.copyright_notice}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {isTracking && currentEpisode >= 1 && (
                <section className="rounded-2xl border border-cyan-600/40 bg-cyan-500/[0.07] p-4 md:p-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                        Where you left off
                    </p>
                    <h2 className="text-lg font-semibold">
                        Episode {currentEpisode}
                        {lastEpisodeData?.title ? ` · ${lastEpisodeData.title}` : ""}
                    </h2>
                    {lastEpisodeData?.synopsis ? (
                        <p className="mt-2 text-sm text-cyan-100/85 leading-relaxed max-w-3xl">
                            {lastEpisodeData.synopsis}
                        </p>
                    ) : (
                        <p className="mt-2 text-sm text-cyan-200/60">
                            No recap available for this episode yet.
                        </p>
                    )}
                </section>
            )}

            <section id="episode-list" className="scroll-mt-20 rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="text-2xl font-semibold">Episode List</h2>
                    <p className="text-sm text-cyan-200/65">Tap an episode to log it in a popup</p>
                </div>
                {series.total_episodes && series.total_episodes > 0 ? (
                    <EpisodeList
                        seriesId={series.id}
                        seriesTitle={series.title}
                        totalEpisodes={series.total_episodes}
                        currentEpisode={currentEpisode}
                        episodes={episodes ?? []}
                    />
                ) : (
                    <p className="rounded-xl border border-cyan-900/45 bg-[#081a2b]/60 p-4 text-sm text-cyan-100/70">
                        No episodes are listed for this series yet.
                    </p>
                )}
            </section>
        </div>
    );
}

type GuestDetailSeries = {
    id: string;
    title: string;
    franchise: string | null;
    synopsis: string | null;
    total_episodes: number | null;
    cover_image_url: string | null;
    original_run: string | null;
};

type GuestEpisode = { episode_number: number; title: string | null; synopsis: string | null };

// Read-only series view for guests (latest-per-franchise series only).
function GuestSeriesDetail({
    series,
    episodes,
}: {
    series: GuestDetailSeries;
    episodes: GuestEpisode[];
}) {
    return (
        <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10 w-full space-y-4">
            <section className="relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-[#05101d] min-h-[280px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(29,111,158,0.45),transparent_42%),linear-gradient(118deg,#020913_8%,#081b2b_54%,#030912_100%)]" />
                <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 md:gap-8 items-start">
                    <div className="order-first md:order-last">
                        <div className="relative mx-auto w-[140px] sm:w-[160px] md:w-full md:max-w-[200px]">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-cyan-700/45 bg-[#071321]/75">
                                {series.cover_image_url ? (
                                    <Image
                                        src={series.cover_image_url}
                                        alt={series.title}
                                        fill
                                        sizes="(max-width: 768px) 160px, 200px"
                                        className="object-cover object-center"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center p-4">
                                        <Image src={tokudexIcon} alt="" className="w-16 h-16 opacity-85" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="order-last md:order-first">
                        <p className="text-xs tracking-[0.3em] uppercase text-cyan-300/80 mb-3">
                            {series.franchise || "Series"}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold leading-[0.95] mb-3">
                            {series.title}
                        </h1>
                        <p className="text-cyan-100/80 text-base leading-relaxed max-w-2xl mb-5">
                            {series.synopsis}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cyan-200/75 mb-5">
                            {series.original_run && (
                                <>
                                    <span>{series.original_run}</span>
                                    <span className="opacity-40">|</span>
                                </>
                            )}
                            <span>{series.total_episodes || "?"} Episodes</span>
                            <span className="rounded-full border border-cyan-600/40 bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-200">
                                Guest preview
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/login"
                                className="tdx-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cyan-500/90 px-5 text-sm font-semibold text-[#031018] hover:bg-cyan-400 transition-colors"
                            >
                                Sign up to track this series
                            </Link>
                            <a
                                href="#episode-list"
                                className="tdx-focus-ring rounded-lg text-sm text-cyan-300/85 hover:text-cyan-200"
                            >
                                Browse episodes ↓
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section id="episode-list" className="scroll-mt-20 rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl p-4 md:p-5">
                <h2 className="text-2xl font-semibold mb-4">Episode List</h2>
                {series.total_episodes && series.total_episodes > 0 ? (
                    <EpisodeList
                        guest
                        seriesId={series.id}
                        seriesTitle={series.title}
                        totalEpisodes={series.total_episodes}
                        currentEpisode={0}
                        episodes={episodes}
                    />
                ) : (
                    <p className="rounded-xl border border-cyan-900/45 bg-[#081a2b]/60 p-4 text-sm text-cyan-100/70">
                        No episodes are listed for this series yet.
                    </p>
                )}
            </section>
        </div>
    );
}

function LockedSeriesView({ title }: { title: string }) {
    return (
        <div className="max-w-2xl mx-auto px-4 py-16 w-full text-center">
            <p className="text-4xl mb-3" aria-hidden>🔒</p>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{title} is members-only</h1>
            <p className="text-sm text-cyan-200/70 mb-6">
                Guests can preview the latest series in each franchise. Create a free account to
                browse the full catalog, track your progress, and earn achievements.
            </p>
            <Link
                href="/login"
                className="tdx-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cyan-500/90 px-5 text-sm font-semibold text-[#031018] hover:bg-cyan-400 transition-colors"
            >
                Create free account
            </Link>
        </div>
    );
}
