import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRatingSummary } from "@/lib/catalogQueries";
import { seriesMetaDescription, seriesUrl } from "@/lib/seo";
import type { CatalogItem, CatalogEpisode } from "@/lib/catalog";
import EpisodeList from "@/app/components/organisms/EpisodeList";
import LogEpisodeButton from "@/app/components/organisms/LogEpisodeButton";
import MovieTracker from "@/app/components/organisms/MovieTracker";
import TitleRating from "@/app/components/organisms/TitleRating";
import AddSeriesButton from "@/app/components/molecules/AddSeriesButton";
import { PosterImage, buttonClasses } from "@/app/components/atoms";
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
            <div className="max-w-3xl mx-auto p-6 space-y-2">
                <h1 className="text-3xl">{s.title}</h1>
                <p className="text-[var(--text-secondary)]">
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
    const last = episodes.find((e) => e.episode_number === current);
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
    return (
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-5">
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
            <section className="tdx-panel p-5 md:p-6 flex flex-col sm:flex-row gap-5">
                <div className="relative aspect-[3/4] w-36 sm:w-[140px] shrink-0 rounded-md overflow-hidden">
                    <PosterImage
                        src={s.cover_image_url}
                        alt={s.title}
                        sizes="192px"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <Link
                        href="/series"
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                    >
                        ← Library
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                        {s.category !== "other" && (
                            <span className="inline-flex items-center rounded-md bg-[var(--accent-tint)] text-[var(--accent-on)] text-[11px] px-2 py-0.5 capitalize">
                                {s.category}
                            </span>
                        )}
                        <span className="text-[11.5px] text-[var(--text-secondary)]">
                            {[
                                s.format === "movie" ? "Movie" : "Series",
                                s.release_year ?? null,
                                s.format === "movie"
                                    ? s.runtime_minutes
                                        ? `${s.runtime_minutes} min`
                                        : null
                                    : (s.total_episodes ?? "?") + " episodes",
                                progress?.status
                                    ? progress.status
                                          .replace("_", " ")
                                          .replace(/^\w/, (c: string) =>
                                              c.toUpperCase(),
                                          )
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </span>
                    </div>
                    <h1 className="text-[34px] font-medium leading-[1.1] tracking-[-0.015em] mt-2">
                        {s.title}
                    </h1>
                    {s.franchise && (
                        <p className="text-[var(--text-secondary)] text-sm mt-1">
                            {s.franchise}
                        </p>
                    )}
                    <p className="text-[13.5px] leading-[1.55] text-[var(--text-secondary)] max-w-[560px] mt-2">
                        {s.synopsis}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 mt-4">
                        {!user ? (
                            <Link
                                href="/login"
                                className={buttonClasses({ size: "sm" })}
                            >
                                Sign in to track and rate
                            </Link>
                        ) : s.format === "series" && !progress ? (
                            <AddSeriesButton seriesId={id} />
                        ) : null}
                        {user &&
                            s.format === "series" &&
                            progress &&
                            (!s.total_episodes ||
                                current < s.total_episodes) && (
                                <LogEpisodeButton
                                    seriesId={id}
                                    seriesTitle={s.title}
                                    episodeNumber={next}
                                    episodeTitle={nextData?.title}
                                    episodeSynopsis={nextData?.synopsis}
                                    className={buttonClasses({ size: "sm" })}
                                />
                            )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--accent-primary)] mt-3">
                        <Link href={`/community/new?id=${id}`}>
                            Suggest a correction
                        </Link>
                        {admin && (
                            <Link href={`/admin?id=${id}`}>Manage title</Link>
                        )}
                    </div>
                </div>
                {user && s.format === "series" && progress && s.total_episodes ? (
                    <div className="text-right flex-none">
                        <div
                            className="w-[92px] h-[92px] rounded-full ml-auto grid place-items-center"
                            style={{
                                background: `conic-gradient(var(--accent-primary) 0 ${Math.round((current / s.total_episodes) * 100)}%, var(--sunk) 0)`,
                            }}
                        >
                            <div className="w-[74px] h-[74px] rounded-full bg-[var(--background)] grid place-items-center text-center">
                                <div>
                                    <p className="text-lg font-medium leading-none">
                                        {Math.round(
                                            (current / s.total_episodes) * 100,
                                        )}
                                        %
                                    </p>
                                    <p className="text-[9px] text-[var(--text-secondary)] tracking-[0.05em] mt-1">
                                        {current} / {s.total_episodes}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-2 text-[11.5px] text-[var(--text-secondary)]">
                            {s.total_episodes - current} episodes left
                        </p>
                    </div>
                ) : null}
            </section>
            {s.format === "movie" && user && (
                <MovieTracker
                    id={id}
                    watched={current === 1}
                    initialNote={progress?.movie_note ?? ""}
                />
            )}
            {s.format === "series" && (
                <>
                    {user && current > 0 && (
                        <section className="tdx-panel p-5 border-l-2 border-l-[var(--accent-primary)]">
                            <h2 className="text-[10px] uppercase tracking-[0.13em] text-[var(--accent-primary)]">
                                Where you left off · Episode {current}
                            </h2>
                            <p className="mt-1 font-medium">{last?.title}</p>
                            <p className="mt-2 text-[var(--text-secondary)]">
                                {last?.synopsis ?? "No recap available yet."}
                            </p>
                            {noteMap[current] && (
                                <div className="mt-3 pt-3 border-t border-[var(--line)]">
                                    <h3 className="text-sm font-medium">
                                        Your private note
                                    </h3>
                                    <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] mt-1">
                                        {noteMap[current]}
                                    </p>
                                </div>
                            )}
                        </section>
                    )}
                    <section className="tdx-panel p-5">
                        <h2 className="text-lg mb-3">Episodes</h2>
                        {!s.total_episodes && (
                            <p className="text-sm mb-3 text-[var(--text-secondary)]">
                                This run has no confirmed total yet. You can
                                keep logging episodes as you watch.
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
                                allowMarkAll={s.total_episodes !== null}
                            />
                        ) : (
                            <p className="text-[var(--text-secondary)]">
                                No episodes listed yet.{" "}
                                <Link
                                    className="underline text-[var(--accent-primary)]"
                                    href={`/community/new?id=${id}`}
                                >
                                    Contribute episode details.
                                </Link>
                            </p>
                        )}
                    </section>
                </>
            )}
            <section className="tdx-panel p-5 space-y-3">
                <h2 className="text-lg">Community rating</h2>
                <p className="text-[var(--text-secondary)] text-sm">
                    {summary
                        ? `${Number(summary.average_score).toFixed(1)}/10 · ${summary.vote_count} ${Number(summary.vote_count) === 1 ? "rating" : "ratings"}`
                        : "Not yet rated"}
                </p>
                {user && (
                    <TitleRating
                        id={id}
                        initialScore={rating?.score ?? null}
                        eligible={
                            s.format === "movie"
                                ? current === 1 &&
                                  progress?.status === "completed"
                                : current >= 1
                        }
                    />
                )}
                <Link
                    className="block text-sm text-[var(--accent-primary)]"
                    href="/rankings"
                >
                    See community rankings →
                </Link>
            </section>
            {user && (
                <details className="tdx-panel p-4">
                    <summary className="cursor-pointer text-sm text-[var(--text-secondary)]">
                        Report inaccurate or abusive content
                    </summary>
                    <ActionForm action={reportTitle}>
                        <input type="hidden" name="id" value={id} />
                        <label className="block text-sm text-[var(--text-secondary)] mt-3">
                            What needs attention?
                            <textarea
                                required
                                maxLength={2000}
                                name="reason"
                                className="tdx-field p-3 mt-1 text-[var(--text-primary)]"
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
