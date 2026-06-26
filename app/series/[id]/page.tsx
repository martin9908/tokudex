import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import EpisodeList from "../../components/EpisodeList";
import AddSeriesButton from "../../components/AddSeriesButton";
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

    if (!user) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 w-full">
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Please sign in</h1>
                <p className="text-sm text-cyan-500/75 mb-4">
                    You need to be logged in to track series.
                </p>
                <Link href="/login" className="text-sm font-medium underline underline-offset-4">
                    Sign In
                </Link>
            </div>
        );
    }

    // Get series
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

    // Get episodes
    const { data: episodes = [] } = await client
        .from("episodes")
        .select("*")
        .eq("series_id", id)
        .order("episode_number", { ascending: true });

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

    const franchiseMeta: Record<string, string> = {
        "Kamen Rider": "2000-2001",
        "Super Sentai": "2023-2024",
        Ultraman: "2023",
    };

    return (
        <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10 w-full space-y-4">
            <section className="relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-[#05101d] min-h-[330px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(29,111,158,0.45),transparent_42%),radial-gradient(circle_at_12%_82%,rgba(8,167,212,0.10),transparent_42%),linear-gradient(118deg,#020913_8%,#081b2b_54%,#030912_100%)]" />
                <div className="pointer-events-none absolute inset-y-0 right-6 hidden md:flex items-center">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-cyan-400/15 blur-2xl" />
                        <div className="relative h-[290px] w-[200px] overflow-hidden rounded-2xl border border-cyan-700/45 bg-[#071321]/75 shadow-[0_18px_50px_rgba(0,0,0,0.42)]">
                            {series.cover_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={series.cover_image_url}
                                    alt={series.title}
                                    className="h-full w-full object-contain object-center p-3"
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
                <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                    <div>
                        <p className="text-xs tracking-[0.3em] uppercase text-red-400/85 mb-3">
                            {series.franchise || "Series"}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold leading-[0.95] mb-3">
                            {series.title}
                        </h1>
                        <p className="text-cyan-100/80 text-base leading-relaxed max-w-2xl mb-5">
                            {series.synopsis}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cyan-200/75 mb-5">
                            <span>
                                {series.original_run || (series.franchise
                                    ? franchiseMeta[series.franchise] || "N/A"
                                    : "N/A")}
                            </span>
                            <span className="opacity-40">|</span>
                            <span>{series.total_episodes || "?"} Episodes</span>
                            <span className="opacity-40">|</span>
                            <span>{progress?.status || "Planning"}</span>
                        </div>
                        <div className="h-2 w-full max-w-lg rounded-full bg-cyan-950/85 overflow-hidden mb-2">
                            <div className="h-full bg-cyan-400" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <p className="text-sm text-cyan-100/70">
                            {currentEpisode} / {series.total_episodes || "?"} episodes tracked
                        </p>
                        {series.copyright_notice && (
                            <p className="mt-6 text-[11px] text-zinc-400/80">
                                {series.copyright_notice}
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border max-w-2xs border-cyan-900/45 bg-[#07182a]/75 p-4 md:p-5">
                        {isTracking ? (
                            <>
                                <p className="text-cyan-100 text-xl font-semibold mb-3">Next Episode</p>
                                <div className="space-y-3 gap-15 flex flex-col">
                                    <p className="text-cyan-300 text-sm font-semibold">
                                        Episode {nextEpisode}
                                    </p>
                                    <Link
                                        href={`/watch?series=${series.id}&episode=${nextEpisode}`}
                                        className="inline-flex w-full justify-center rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-[#031018] px-4 py-2.5 text-sm font-semibold transition-colors"
                                    >
                                        Log Episode {nextEpisode}
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-cyan-100 text-xl font-semibold mb-1">Not Tracking Yet</p>
                                <p className="text-xs text-cyan-200/65 mb-3">
                                    Add this series to your tracker, or tap an episode below to start logging.
                                </p>
                                <AddSeriesButton seriesId={series.id} />
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 backdrop-blur-xl p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="text-2xl font-semibold">Episode List</h2>
                    <p className="text-sm text-cyan-200/65">Tap an episode to update progress</p>
                </div>
                <EpisodeList
                    seriesId={series.id}
                    totalEpisodes={series.total_episodes || 0}
                    currentEpisode={currentEpisode}
                    episodes={episodes ?? []}
                />
            </section>
        </div>
    );
}
