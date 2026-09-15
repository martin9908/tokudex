import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRatingSummary } from "@/lib/catalogQueries";
import { seriesMetaDescription, seriesUrl } from "@/lib/seo";
import type { CatalogItem, CatalogEpisode } from "@/lib/catalog";
import EpisodeList from "@/app/components/organisms/EpisodeList";
import LogEpisodeButton from "@/app/components/organisms/LogEpisodeButton";
import MovieTracker, {
    MovieStatusButtons,
} from "@/app/components/organisms/MovieTracker";
import TitleRating from "@/app/components/organisms/TitleRating";
import AddSeriesButton from "@/app/components/molecules/AddSeriesButton";
import MarkAllButton from "@/app/components/molecules/MarkAllButton";
import ShareLinkButton from "@/app/components/molecules/ShareLinkButton";
import { FilmSlate } from "@phosphor-icons/react/ssr";
import { PosterImage, buttonClasses } from "@/app/components/atoms";
import { STATUS_LABELS } from "@/app/components/molecules/StatusChoice";
import type { ProgressStatus } from "@/app/components/molecules/StatusChoice";
import JsonLd from "@/app/components/JsonLd";
import ActionForm from "@/app/components/forms/ActionForm";
import { reportTitle } from "@/app/community/actions";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const client = await createClient();
    const { data: s } = await client
        .from("series")
        .select("*")
        .eq("id", id)
        .eq("hidden", false)
        .maybeSingle();
    return s
        ? {
              title: s.title,
              description: seriesMetaDescription(s),
              alternates: { canonical: `/series/${id}` },
              openGraph: {
                  type: s.format === "movie" ? "video.movie" : "video.tv_show",
                  url: seriesUrl(id),
                  title: s.title,
              },
          }
        : {
              title: "Title unavailable",
              robots: { index: false, follow: false },
          };
}
export default async function TitleDetail({ params }: Props) {
    const { id } = await params;
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client
        .from("series")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error || !data) notFound();
    const s = data as CatalogItem;
    const { data: progress } = user
        ? await client
              .from("user_series_progress")
              .select("*")
              .eq("series_id", id)
              .eq("user_id", user.id)
              .maybeSingle()
        : { data: null };
    if (s.hidden)
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-2">
                <h1 className="text-[26px]">{s.title}</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    This title is currently unavailable. Your tracking history
                    has been preserved.
                </p>
                {progress && (
                    <p className="text-[var(--text-secondary)]">
                        {s.format === "movie"
                            ? progress.current_episode === 1
                                ? "Watched"
                                : "Plan to Watch"
                            : `Episode ${progress.current_episode}`}
                    </p>
                )}
                <Link href="/" className="text-[var(--accent-primary)] block">
                    Back to tracker
                </Link>
            </div>
        );
    const [
        { data: episodeRows, error: episodesError },
        summary,
        { data: rating },
        { data: admin },
    ] = await Promise.all([
        client
            .from("episodes")
            .select("*")
            .eq("series_id", id)
            .order("episode_number"),
        getRatingSummary(id),
        user
            ? client
                  .from("title_ratings")
                  .select("score")
                  .eq("series_id", id)
                  .eq("user_id", user.id)
                  .maybeSingle()
            : Promise.resolve({ data: null }),
        user
            ? client.rpc("is_catalog_admin")
            : Promise.resolve({ data: false }),
    ]);
    if (episodesError) throw new Error("Could not load episodes.");
    const episodes = (episodeRows ?? []) as CatalogEpisode[];
    const current = progress?.current_episode ?? 0;
    const next = current + 1;
    const nextData = episodes.find((e) => e.episode_number === next);
    const { data: notes } = user
        ? await client
              .from("episode_notes")
              .select("episode_number,note")
              .eq("series_id", id)
              .eq("user_id", user.id)
        : { data: null };
    const noteMap = Object.fromEntries(
        (notes ?? []).map((n) => [n.episode_number, n.note]),
    );
    const total =
        s.total_episodes ??
        Math.max(
            current,
            ...episodes.map((e) => e.episode_number),
            ...Object.keys(noteMap).map(Number),
            0,
        );
    const isMovie = s.format === "movie";
    const tracked = Boolean(progress);
    const statusLabel = progress?.status
        ? STATUS_LABELS[progress.status as ProgressStatus]
        : null;
    const pct =
        !isMovie && s.total_episodes
            ? Math.round((current / s.total_episodes) * 100)
            : null;
    const left = !isMovie && s.total_episodes ? s.total_episodes - current : null;
    // ~25 minutes per broadcast episode — rough, but enough to plan an evening.
    const hoursLeft = left !== null ? Math.round((left * 25) / 60) : null;
    const eligible = isMovie
        ? current === 1 && progress?.status === "completed"
        : current >= 1;
    const meta = [
        s.release_year,
        isMovie
            ? s.runtime_minutes
                ? `${s.runtime_minutes} min`
                : null
            : `${s.total_episodes ?? "?"} episodes`,
        !isMovie ? statusLabel : null,
    ]
        .filter(Boolean)
        .join(" · ");
    const community = summary
        ? {
              average: Number(summary.average_score),
              votes: Number(summary.vote_count),
          }
        : null;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 flex flex-col gap-5">
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": s.format === "movie" ? "Movie" : "TVSeries",
                    name: s.title,
                    description: s.synopsis ?? undefined,
                    image: s.cover_image_url ?? undefined,
                    url: seriesUrl(id),
                    ...(s.format === "movie"
                        ? {
                              duration: s.runtime_minutes
                                  ? `PT${s.runtime_minutes}M`
                                  : undefined,
                          }
                        : { numberOfEpisodes: s.total_episodes ?? undefined }),
                    ...(summary
                        ? {
                              aggregateRating: {
                                  "@type": "AggregateRating",
                                  ratingValue: Number(summary.average_score),
                                  ratingCount: Number(summary.vote_count),
                                  bestRating: 10,
                                  worstRating: 1,
                              },
                          }
                        : {}),
                }}
            />
            <section className="tdx-panel p-4 sm:p-6 flex flex-col sm:flex-row gap-5">
                <div
                    className={`relative aspect-[3/4] shrink-0 rounded-md overflow-hidden ${isMovie ? "w-[132px]" : "w-[140px]"}`}
                >
                    <PosterImage
                        src={s.cover_image_url}
                        alt={s.title}
                        sizes="192px"
                    />
                </div>
                <div className="flex-1 min-w-0 max-w-[620px]">
                    <div className="flex items-center gap-2 flex-wrap">
                        {isMovie ? (
                            <>
                                <span className="tdx-chip tdx-chip-accent text-[10.5px]">
                                    <FilmSlate size={12} aria-hidden />
                                    Movie
                                </span>
                                {s.category !== "other" && (
                                    <span className="tdx-chip text-[10.5px] capitalize">
                                        {s.category}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="tdx-chip tdx-chip-accent text-[11px] capitalize">
                                {s.franchise ?? s.category}
                            </span>
                        )}
                        <span className="text-[11.5px] text-[var(--text-secondary)]">
                            {meta}
                        </span>
                    </div>
                    <h1
                        className={`font-medium mt-2 ${isMovie ? "text-[26px] leading-[1.15] tracking-[-0.02em]" : "text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.015em]"}`}
                    >
                        {s.title}
                    </h1>
                    {!isMovie && s.franchise && s.category !== "tokusatsu" && (
                        <p className="text-[var(--text-secondary)] text-sm mt-1 capitalize">
                            {s.category}
                        </p>
                    )}
                    {s.synopsis && (
                        <p className="text-[13.5px] leading-[1.55] text-[var(--text-secondary)] max-w-[560px] mt-2">
                            {s.synopsis}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2.5 mt-4">
                        {!user ? (
                            <Link href="/login" className={buttonClasses()}>
                                Sign in to track and rate
                            </Link>
                        ) : isMovie ? (
                            <MovieStatusButtons id={id} watched={current === 1} />
                        ) : !tracked ? (
                            <AddSeriesButton seriesId={id} />
                        ) : (
                            <>
                                {(!s.total_episodes ||
                                    current < s.total_episodes) && (
                                    <LogEpisodeButton
                                        seriesId={id}
                                        seriesTitle={s.title}
                                        episodeNumber={next}
                                        episodeTitle={nextData?.title}
                                        episodeSynopsis={nextData?.synopsis}
                                        episodeType={nextData?.episode_type}
                                        label={`Log episode ${next}`}
                                        className={buttonClasses()}
                                    />
                                )}
                                {s.total_episodes &&
                                    current < s.total_episodes && (
                                        <MarkAllButton
                                            seriesId={id}
                                            totalEpisodes={s.total_episodes}
                                        />
                                    )}
                                <ShareLinkButton
                                    url={seriesUrl(id)}
                                    title={s.title}
                                    text={
                                        s.total_episodes
                                            ? `${current} / ${s.total_episodes} of ${s.title} on TokuDex`
                                            : `Tracking ${s.title} on TokuDex`
                                    }
                                />
                            </>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-[var(--accent-primary)] mt-3.5">
                        {user && (
                            <Link href={`/community/new?id=${id}`}>
                                Suggest a correction
                            </Link>
                        )}
                        {admin && (
                            <Link href={`/admin?id=${id}`}>Manage title</Link>
                        )}
                    </div>
                </div>
                {pct !== null && tracked && user ? (
                    <div className="text-right flex-none">
                        <div
                            className="w-[108px] h-[108px] rounded-full ml-auto grid place-items-center"
                            style={{
                                background: `conic-gradient(var(--accent-primary) 0 ${pct}%, var(--sunk) ${pct}%)`,
                            }}
                        >
                            <div className="w-[86px] h-[86px] rounded-full bg-[var(--background)] grid place-items-center text-center">
                                <div>
                                    <p className="text-[23px] font-medium leading-none">
                                        {pct}%
                                    </p>
                                    <p className="text-[10px] text-[var(--text-secondary)] tracking-[0.05em] mt-1">
                                        {current} / {s.total_episodes}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-2.5 text-[11.5px] text-[var(--text-secondary)]">
                            {left === 0
                                ? "All caught up"
                                : `${left} episode${left === 1 ? "" : "s"} left${hoursLeft ? ` · ~${hoursLeft}h` : ""}`}
                        </p>
                    </div>
                ) : null}
            </section>

            <div
                className={`grid gap-5 ${isMovie ? "lg:grid-cols-[1fr_1fr]" : "lg:grid-cols-[1fr_320px]"} items-start`}
            >
                {isMovie ? (
                    <>
                        {user && (
                            <TitleRating
                                id={id}
                                initialScore={rating?.score ?? null}
                                eligible={eligible}
                                unlockLabel="Mark watched"
                                onUnlock="#top"
                                community={community}
                            />
                        )}
                        {user && (
                            <MovieTracker
                                id={id}
                                watched={current === 1}
                                initialNote={progress?.movie_note ?? ""}
                            />
                        )}
                        {!user && (
                            <section className="tdx-panel p-3.5">
                                <span className="tdx-eyebrow">Community rating</span>
                                <p className="text-sm mt-2">
                                    {community
                                        ? `${community.average.toFixed(1)}/10 · ${community.votes} ${community.votes === 1 ? "rating" : "ratings"}`
                                        : "Not enough ratings yet"}
                                </p>
                            </section>
                        )}
                    </>
                ) : (
                    <>
                        <section className="tdx-panel p-4 sm:p-5 min-w-0">
                            {!s.total_episodes && (
                                <p className="tdx-callout tdx-callout-line mb-3">
                                    This run has no confirmed total yet. Keep
                                    logging episodes as you watch.
                                </p>
                            )}
                            {total > 0 ? (
                                <EpisodeList
                                    seriesId={id}
                                    seriesTitle={s.title}
                                    totalEpisodes={total}
                                    currentEpisode={current}
                                    episodes={episodes}
                                    guest={!user}
                                    notes={noteMap}
                                    lastWatchedAt={progress?.last_watched_at ?? null}
                                />
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    No episodes listed yet.{" "}
                                    <Link
                                        className="text-[var(--accent-primary)]"
                                        href={`/community/new?id=${id}`}
                                    >
                                        Contribute episode details.
                                    </Link>
                                </p>
                            )}
                        </section>
                        <div className="flex flex-col gap-4">
                            {user ? (
                                <TitleRating
                                    id={id}
                                    initialScore={rating?.score ?? null}
                                    eligible={eligible}
                                    unlockLabel={`Log episode ${next}`}
                                    onUnlock={`/watch?series=${id}&episode=${next}`}
                                    community={community}
                                />
                            ) : (
                                <section className="tdx-panel p-3.5">
                                    <span className="tdx-eyebrow">Community rating</span>
                                    <p className="text-sm mt-2">
                                        {community
                                            ? `${community.average.toFixed(1)}/10 · ${community.votes} ${community.votes === 1 ? "rating" : "ratings"}`
                                            : "Not enough ratings yet"}
                                    </p>
                                </section>
                            )}
                            <Link
                                className="text-xs text-[var(--accent-primary)]"
                                href="/rankings"
                            >
                                See community rankings →
                            </Link>
                        </div>
                    </>
                )}
            </div>
            {user && (
                <details className="tdx-panel p-4">
                    <summary className="cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        Report inaccurate or abusive content
                    </summary>
                    <ActionForm action={reportTitle}>
                        <input type="hidden" name="id" value={id} />
                        <label className="tdx-label mt-3">
                            What needs attention?
                            <textarea
                                required
                                maxLength={2000}
                                name="reason"
                                className="tdx-field tdx-field-sunk mt-1.5 min-h-[62px]"
                            />
                        </label>
                        <button
                            className={`${buttonClasses({ variant: "secondary", size: "sm" })} mt-3`}
                        >
                            Submit report
                        </button>
                    </ActionForm>
                </details>
            )}
        </div>
    );
}
