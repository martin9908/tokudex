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
import { FilmSlate, ArrowLeft, DotsThree } from "@phosphor-icons/react/ssr";
import {
    PosterImage,
    BigNumber,
    Bar,
    HairlineRule,
    buttonClasses,
} from "@/app/components/atoms";
import SeriesStatusPills from "@/app/components/molecules/SeriesStatusPills";
import type { ProgressStatus } from "@/lib/validation";
import { getRankProgress } from "@/app/actions";
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
                                : "Someday"
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
    const eligible = isMovie
        ? current === 1 && progress?.status === "completed"
        : current >= 1;
    const community = summary
        ? {
              average: Number(summary.average_score),
              votes: Number(summary.vote_count),
          }
        : null;
    const rankProgress = user ? await getRankProgress() : null;
    const eyebrow = [
        s.franchise ?? (s.category === "other" ? null : s.category),
        s.release_year,
    ]
        .filter(Boolean)
        .join(" · ");
    const lastNote =
        current > 0 && noteMap[current] ? String(noteMap[current]) : null;

    const jsonLd = (
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
    );

    const reportPanel = user && (
        <details className="mx-[18px] md:mx-[30px] mb-6 rounded-lg border border-[var(--line)] p-4">
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
    );

    if (isMovie) {
        return (
            <div className="w-full px-4 sm:px-6 py-6 pb-24 md:pb-10 flex flex-col gap-5">
                {jsonLd}
                <section className="tdx-panel p-4 sm:p-6 flex flex-col sm:flex-row gap-5">
                    <div className="relative aspect-[3/4] shrink-0 rounded-md overflow-hidden w-[132px]">
                        <PosterImage
                            src={s.cover_image_url}
                            alt={s.title}
                            sizes="192px"
                        />
                    </div>
                    <div className="flex-1 min-w-0 max-w-[620px]">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="tdx-chip tdx-chip-accent text-[10.5px]">
                                <FilmSlate size={12} aria-hidden />
                                Movie
                            </span>
                            {s.category !== "other" && (
                                <span className="tdx-chip text-[10.5px] capitalize">
                                    {s.category}
                                </span>
                            )}
                            <span className="text-[11.5px] text-[var(--text-secondary)]">
                                {[
                                    s.release_year,
                                    s.runtime_minutes
                                        ? `${s.runtime_minutes} min`
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                        </div>
                        <h1 className="font-medium mt-2 text-[26px] leading-[1.15] tracking-[-0.02em]">
                            {s.title}
                        </h1>
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
                            ) : (
                                <MovieStatusButtons id={id} watched={current === 1} />
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
                </section>
                <div className="grid gap-5 lg:grid-cols-[1fr_1fr] items-start">
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

    const canLog = tracked && (!s.total_episodes || current < s.total_episodes);
    const logButton = canLog && (
        <LogEpisodeButton
            seriesId={id}
            seriesTitle={s.title}
            totalEpisodes={s.total_episodes}
            episodeNumber={next}
            episodeTitle={nextData?.title}
            episodeSynopsis={nextData?.synopsis}
            episodeType={nextData?.episode_type}
            initialStatus={
                progress?.status === "plan_to_watch"
                    ? "watching"
                    : (progress?.status as ProgressStatus | undefined)
            }
            initialNote={noteMap[next] ? String(noteMap[next]) : ""}
            episodesLogged={rankProgress?.logged ?? null}
            label={`Log ${next}`}
            className={buttonClasses({
                className: "min-h-[40px] px-4 flex-1 md:flex-none",
            })}
        />
    );

    return (
        <div className="w-full pb-24 md:pb-10">
            {jsonLd}
            {/* Mobile header */}
            <div className="md:hidden flex items-center gap-3 px-[18px] py-[14px] border-b border-[var(--line)] text-[13.5px]">
                <Link
                    href="/series"
                    aria-label="Back to your dex"
                    className="tdx-focus-ring rounded text-[var(--text-secondary)]"
                >
                    <ArrowLeft size={18} aria-hidden />
                </Link>
                <span className="truncate">{s.title}</span>
                {user && (
                    <Link
                        href={`/community/new?id=${id}`}
                        aria-label="Suggest a correction"
                        className="tdx-focus-ring ml-auto rounded text-[var(--text-secondary)]"
                    >
                        <DotsThree size={20} weight="bold" aria-hidden />
                    </Link>
                )}
            </div>

            {/* Hero */}
            <section className="flex gap-[14px] md:gap-[26px] px-[18px] md:px-[30px] pt-[18px] md:pt-[30px] pb-[18px] md:pb-[26px]">
                <div className="relative w-[86px] md:w-[124px] aspect-[3/4] flex-none rounded-md overflow-hidden">
                    <PosterImage
                        src={s.cover_image_url}
                        alt={s.title}
                        sizes="124px"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] md:text-[10.5px] md:tracking-[0.34em] md:uppercase text-[var(--text-secondary)] md:font-medium">
                        {eyebrow}
                    </p>
                    <h1 className="text-[18px] md:text-[30px] font-medium tracking-[-0.025em] mt-[7px] md:mt-[13px] leading-[1.2] md:leading-[1.1]">
                        {s.title}
                    </h1>
                    {tracked && (
                        <p className="md:hidden text-[12px] text-[var(--text-secondary)] mt-2">
                            {current} of {s.total_episodes ?? "?"}
                            {rating?.score ? ` · ${rating.score}/10` : ""}
                        </p>
                    )}
                    <div className="hidden md:flex items-center gap-5 mt-5 flex-wrap">
                        {tracked ? (
                            <>
                                <div className="flex items-baseline gap-[7px]">
                                    <BigNumber size={34}>{current}</BigNumber>
                                    <span className="text-[13px] text-[var(--text-secondary)]">
                                        of {s.total_episodes ?? "?"}
                                    </span>
                                </div>
                                {s.total_episodes ? (
                                    <div className="flex-1 min-w-[180px]">
                                        <Bar
                                            value={current}
                                            max={s.total_episodes}
                                            label="Watch progress"
                                        />
                                    </div>
                                ) : null}
                                {logButton}
                                {s.total_episodes && current < s.total_episodes && (
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
                                    label="Share"
                                    variant="ghost"
                                    size="sm"
                                />
                            </>
                        ) : user ? (
                            <AddSeriesButton seriesId={id} />
                        ) : (
                            <Link href="/login" className={buttonClasses()}>
                                Sign in to track and rate
                            </Link>
                        )}
                    </div>
                    <div className="hidden md:flex flex-wrap gap-4 text-xs text-[var(--accent-primary)] mt-4">
                        {user && (
                            <Link href={`/community/new?id=${id}`}>
                                Suggest a correction
                            </Link>
                        )}
                        {admin && <Link href={`/admin?id=${id}`}>Manage title</Link>}
                    </div>
                </div>
                {s.synopsis && (
                    <p className="hidden lg:block w-[210px] flex-none text-[12.5px] text-[var(--text-secondary)] leading-[1.65]">
                        {s.synopsis}
                    </p>
                )}
            </section>

            {/* Status + mobile actions */}
            {tracked && progress && (
                <div className="px-[18px] md:px-[30px] pb-4 md:pb-[18px] flex flex-col gap-4">
                    <SeriesStatusPills
                        seriesId={id}
                        currentEpisode={current}
                        status={progress.status as ProgressStatus}
                        size="sm"
                    />
                    <div className="md:hidden flex gap-[9px]">
                        {logButton}
                        {s.total_episodes && current < s.total_episodes && (
                            <MarkAllButton
                                seriesId={id}
                                totalEpisodes={s.total_episodes}
                            />
                        )}
                    </div>
                </div>
            )}
            {!tracked && user && (
                <div className="md:hidden px-[18px] pb-4">
                    <AddSeriesButton seriesId={id} />
                </div>
            )}
            {!user && (
                <div className="md:hidden px-[18px] pb-4">
                    <Link href="/login" className={buttonClasses()}>
                        Sign in to track and rate
                    </Link>
                </div>
            )}
            <HairlineRule inset={34} />

            {/* Episodes */}
            {!s.total_episodes && (
                <p className="tdx-callout tdx-callout-line mx-[18px] md:mx-[30px] my-3">
                    This run has no confirmed total yet. Keep logging episodes
                    as you watch.
                </p>
            )}
            {total > 0 ? (
                <EpisodeList
                    seriesId={id}
                    seriesTitle={s.title}
                    totalEpisodes={total}
                    currentEpisode={current}
                    status={progress?.status as ProgressStatus | undefined}
                    episodes={episodes}
                    guest={!user}
                    notes={noteMap}
                    episodesLogged={rankProgress?.logged ?? null}
                />
            ) : (
                <p className="px-[18px] md:px-[30px] py-4 text-sm text-[var(--text-secondary)]">
                    No episodes listed yet.{" "}
                    <Link
                        className="text-[var(--accent-primary)]"
                        href={`/community/new?id=${id}`}
                    >
                        Contribute episode details.
                    </Link>
                </p>
            )}

            {/* Note to self + rating */}
            {user && (
                <>
                    <HairlineRule inset={34} />
                    <div className="grid md:grid-cols-[1fr_320px] gap-6 px-[18px] md:px-[30px] py-5">
                        <div>
                            <p className="text-[12.5px] text-[var(--text-secondary)]">
                                Note to self
                                {lastNote && (
                                    <span className="text-[var(--text-muted)]">
                                        {" "}
                                        · episode {current}
                                    </span>
                                )}
                            </p>
                            {lastNote ? (
                                <p
                                    className="mt-[9px] min-h-[64px] px-[13px] py-[11px] rounded-[7px] border border-[var(--line)] text-[13.5px] leading-[1.6] whitespace-pre-wrap"
                                    style={{ fontFamily: "ui-serif, Georgia, serif" }}
                                >
                                    {lastNote}
                                </p>
                            ) : (
                                <p className="mt-[9px] text-[12.5px] text-[var(--text-muted)] leading-[1.55]">
                                    {tracked
                                        ? "Nothing written yet. The check-in sheet has a place for it — only you can read it."
                                        : "Start tracking to keep private notes on each episode."}
                                </p>
                            )}
                        </div>
                        <TitleRating
                            id={id}
                            initialScore={rating?.score ?? null}
                            eligible={eligible}
                            unlockLabel={`Log episode ${next}`}
                            onUnlock={`/watch?series=${id}&episode=${next}`}
                            community={community}
                        />
                    </div>
                </>
            )}
            {!user && community && (
                <p className="px-[18px] md:px-[30px] py-4 text-[12.5px] text-[var(--text-secondary)]">
                    Community average{" "}
                    <span className="text-[var(--text-primary)]">
                        {community.average.toFixed(1)}
                    </span>{" "}
                    from {community.votes} {community.votes === 1 ? "rating" : "ratings"} ·{" "}
                    <Link href="/rankings" className="text-[var(--accent-primary)]">
                        Rankings
                    </Link>
                </p>
            )}
            {reportPanel}
        </div>
    );
}
