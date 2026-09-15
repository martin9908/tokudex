import Link from "next/link";
import {
    CheckCircle,
    FilmSlate,
    Trophy,
    Medal,
    Sparkle,
    LockSimple,
    SquaresFour,
} from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/supabase/server";
import { getUserProgressBySeries } from "@/lib/supabase/queries";
import { getReferralCount } from "@/lib/referrals";
import { toWatchItems, summarizeProgress, relativeTime } from "@/lib/progress";
import { isTokuSeries } from "@/lib/catalog";
import { getRank, getAchievements, countEarned } from "@/lib/achievements";
import type { ProgressStatus } from "@/lib/validation";
import { PosterImage, ProgressBar, buttonClasses } from "./components/atoms";
import LogEpisodeButton from "./components/organisms/LogEpisodeButton";
import GuestHome from "./components/organisms/GuestHome";
import SupportBanner from "./components/molecules/SupportBanner";
import ChangeStatusSelect from "./components/molecules/ChangeStatusSelect";
import ResumeButton from "./components/molecules/ResumeButton";
import MarkWatchedButton from "./components/molecules/MarkWatchedButton";
import { getGuestSeries } from "@/lib/guest";

const CATEGORY_LABEL: Record<string, string> = {
    tokusatsu: "Tokusatsu",
    anime: "Anime",
    other: "Other",
};

const MILESTONE_ICONS = [Trophy, Medal, Sparkle];

export default async function Home() {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) return <GuestHome />;

    const rows = await getUserProgressBySeries(user.id);
    const items = toWatchItems(rows);
    const stats = summarizeProgress(rows);
    const toku = items.filter((i) => isTokuSeries(i.series));
    const tokuCompleted = toku.filter(
        (i) => i.progress.status === "completed",
    );
    const tokuEpisodesLogged = toku.reduce(
        (n, i) => n + i.progress.current_episode,
        0,
    );

    const seriesItems = items.filter((i) => i.series.format === "series");
    const movieItems = items.filter((i) => i.series.format === "movie");
    const episodes = seriesItems.reduce(
        (sum, i) => sum + i.progress.current_episode,
        0,
    );
    const moviesWatched = movieItems.filter(
        (i) => i.progress.current_episode === 1,
    ).length;

    const upNext =
        seriesItems.find((i) => i.progress.status !== "completed") ??
        seriesItems[0];
    const alsoWatching = seriesItems.filter((i) => i !== upNext);

    const [
        { data: lastEpisode },
        referralCount,
        { data: submissionRows },
        suggestions,
    ] = await Promise.all([
        upNext
            ? client
                  .from("episodes")
                  .select("title, synopsis")
                  .eq("series_id", upNext.series.id)
                  .eq("episode_number", upNext.progress.current_episode)
                  .maybeSingle()
            : Promise.resolve({ data: null }),
        getReferralCount(user.id),
        client
            .from("catalog_submissions")
            .select("status")
            .eq("author_id", user.id),
        items.length === 0 ? getGuestSeries() : Promise.resolve([]),
    ]);
    const submissionCounts = { pending: 0, published: 0, rejected: 0 };
    for (const row of submissionRows ?? []) {
        if (row.status in submissionCounts)
            submissionCounts[row.status as keyof typeof submissionCounts] += 1;
    }

    const { current: rankCurrent, next: rankNext } = getRank(
        tokuEpisodesLogged,
    );
    const rankPct = rankNext
        ? Math.round(
              ((tokuEpisodesLogged - rankCurrent.min) /
                  (rankNext.min - rankCurrent.min)) *
                  100,
          )
        : 100;
    const milestones = getAchievements({
        seriesTracked: toku.length,
        episodesLogged: tokuEpisodesLogged,
        seriesCompleted: tokuCompleted.length,
        referralCount,
    });
    const earnedCount = countEarned(milestones);
    const earnedMilestones = milestones.filter((m) => m.earned);
    const lastEarned = earnedMilestones[earnedMilestones.length - 1];
    const nextMilestone = milestones.find((m) => !m.earned);

    const upNextBadge = upNext
        ? (upNext.series.franchise ??
          CATEGORY_LABEL[upNext.series.category] ??
          null)
        : null;

    return (
        <div className="max-w-6xl mx-auto px-6 py-6 pb-24">
            {items.length === 0 && (
                <section className="mb-6">
                    <div className="p-7 rounded-lg border border-dashed border-[var(--line)] text-center">
                        <SquaresFour
                            size={32}
                            className="mx-auto text-[var(--text-muted)]"
                        />
                        <h2 className="text-base font-medium mt-3">
                            Nothing tracked yet
                        </h2>
                        <p className="text-[12.5px] text-[var(--text-secondary)] mt-1.5 leading-[1.5] max-w-[330px] mx-auto">
                            Pick a series you&apos;re watching and log the
                            episode you&apos;re on. Everything else — rank,
                            badges, rankings — follows from that.
                        </p>
                        <div className="flex gap-2.5 justify-center mt-4 flex-wrap">
                            <Link href="/welcome" className={buttonClasses()}>
                                Get started
                            </Link>
                            <Link
                                href="/series"
                                className={buttonClasses({ variant: "secondary" })}
                            >
                                Browse the catalog
                            </Link>
                            <Link
                                href="/community/new"
                                className={buttonClasses({ variant: "secondary" })}
                            >
                                Add a title
                            </Link>
                        </div>
                    </div>
                    {suggestions.length > 0 && (
                        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {suggestions.slice(0, 2).map((s, i) => (
                                <Link
                                    key={s.id}
                                    href={`/series/${s.id}`}
                                    className="tdx-focus-ring tdx-panel p-3 hover:border-[var(--accent-primary)] transition-colors"
                                >
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {i === 0
                                            ? "Popular right now"
                                            : "Good place to start"}
                                    </p>
                                    <p className="text-[13px] mt-1.5">
                                        {s.title}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_292px] gap-6">
                <div className="flex flex-col gap-6 min-w-0">
                    {upNext && (
                        <section>
                            <div className="flex items-baseline gap-2.5 mb-2.5">
                                <span className="text-[10.5px] uppercase tracking-[0.13em] text-[var(--accent-primary)]">
                                    Up next
                                </span>
                                <span className="text-[11.5px] text-[var(--text-muted)]">
                                    last logged{" "}
                                    {relativeTime(
                                        upNext.progress.last_watched_at,
                                    )}
                                </span>
                            </div>
                            <article className="p-4 md:p-[18px] rounded-lg bg-[var(--surface)] border border-[var(--line)] flex gap-5 flex-col sm:flex-row">
                                <Link
                                    href={`/series/${upNext.series.id}`}
                                    className="tdx-focus-ring relative aspect-[3/4] w-full sm:w-[132px] flex-none rounded-md overflow-hidden"
                                >
                                    <PosterImage
                                        src={upNext.series.cover_image_url}
                                        alt={upNext.series.title}
                                        sizes="(max-width:640px) 90vw, 132px"
                                    />
                                </Link>
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {upNextBadge && (
                                            <span className="inline-flex items-center rounded-md bg-[var(--accent-tint)] text-[var(--accent-on)] text-[11px] px-2 py-0.5">
                                                {upNextBadge}
                                            </span>
                                        )}
                                        <span className="text-[11.5px] text-[var(--text-muted)]">
                                            {[
                                                upNext.series.release_year,
                                                upNext.series.total_episodes
                                                    ? `${upNext.series.total_episodes} episodes`
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </span>
                                    </div>
                                    <h2 className="text-[23px] font-medium mt-1.5 leading-[1.15] tracking-[-0.015em]">
                                        {upNext.series.title}
                                    </h2>
                                    <div className="mt-3 text-[13.5px]">
                                        <span className="text-[var(--accent-text)]">
                                            Episode{" "}
                                            {upNext.progress.current_episode}
                                        </span>
                                        {lastEpisode?.title
                                            ? ` · ${lastEpisode.title}`
                                            : ""}
                                    </div>
                                    {upNext.series.total_episodes && (
                                        <div className="mt-2.5 flex items-center gap-2.5">
                                            <div className="flex-1">
                                                <ProgressBar
                                                    value={
                                                        upNext.progress
                                                            .current_episode
                                                    }
                                                    max={
                                                        upNext.series
                                                            .total_episodes
                                                    }
                                                    size="sm"
                                                    label="Watch progress"
                                                />
                                            </div>
                                            <span className="text-[11.5px] text-[var(--text-secondary)] whitespace-nowrap">
                                                {upNext.progress.current_episode}{" "}
                                                / {upNext.series.total_episodes}{" "}
                                                ·{" "}
                                                {Math.round(
                                                    (upNext.progress
                                                        .current_episode /
                                                        upNext.series
                                                            .total_episodes) *
                                                        100,
                                                )}
                                                %
                                            </span>
                                        </div>
                                    )}
                                    <div className="mt-3.5 p-[11px] rounded-md bg-[var(--sunk)] border-l-2 border-l-[var(--accent-primary)]">
                                        <div className="text-[9.5px] uppercase tracking-[0.13em] text-[var(--accent-text)] mb-1">
                                            Where you left off · ep{" "}
                                            {upNext.progress.current_episode}
                                        </div>
                                        <p className="text-[13px] leading-[1.5]">
                                            {lastEpisode?.synopsis ??
                                                "No recap available yet."}
                                        </p>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center gap-2.5 flex-wrap">
                                        {!upNext.series.hidden &&
                                            (!upNext.series.total_episodes ||
                                                upNext.progress
                                                    .current_episode <
                                                    upNext.series
                                                        .total_episodes) && (
                                                <LogEpisodeButton
                                                    seriesId={upNext.series.id}
                                                    seriesTitle={
                                                        upNext.series.title
                                                    }
                                                    episodeNumber={
                                                        upNext.progress
                                                            .current_episode +
                                                        1
                                                    }
                                                    label={`Log episode ${upNext.progress.current_episode + 1}`}
                                                    className={buttonClasses({
                                                        size: "sm",
                                                    })}
                                                />
                                            )}
                                        <Link
                                            href={`/series/${upNext.series.id}`}
                                            className={buttonClasses({
                                                variant: "secondary",
                                                size: "sm",
                                            })}
                                        >
                                            Open tracker
                                        </Link>
                                        <ChangeStatusSelect
                                            seriesId={upNext.series.id}
                                            currentEpisode={
                                                upNext.progress.current_episode
                                            }
                                            status={
                                                upNext.progress
                                                    .status as ProgressStatus
                                            }
                                            className="ml-auto text-sm"
                                        />
                                    </div>
                                </div>
                            </article>
                        </section>
                    )}

                    {alsoWatching.length > 0 && (
                        <section>
                            <div className="flex items-baseline gap-2.5 mb-2.5">
                                <span className="text-[10.5px] uppercase tracking-[0.13em] text-[var(--text-secondary)]">
                                    Also watching
                                </span>
                                <span className="text-[11.5px] text-[var(--text-muted)]">
                                    {alsoWatching.length} series
                                </span>
                                <Link
                                    href="/series"
                                    className="ml-auto text-xs text-[var(--accent-primary)]"
                                >
                                    Browse library →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                                {alsoWatching.map(({ series: s, progress: p }) => {
                                    const onHold = p.status === "on_hold";
                                    const atFinale = s.total_episodes
                                        ? p.current_episode + 1 ===
                                          s.total_episodes
                                        : false;
                                    return (
                                        <div
                                            key={s.id}
                                            className="flex flex-col gap-[9px] p-[11px] rounded-lg bg-[var(--surface)] border border-[var(--line)]"
                                        >
                                            <Link
                                                href={`/series/${s.id}`}
                                                className="tdx-focus-ring relative aspect-[3/4] rounded-[5px] overflow-hidden block"
                                            >
                                                <PosterImage
                                                    src={s.cover_image_url}
                                                    alt={s.title}
                                                    sizes="(max-width:640px) 45vw, 220px"
                                                />
                                            </Link>
                                            <p className="text-[13px] font-medium leading-tight">
                                                {s.title}
                                            </p>
                                            {onHold ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-[5px] border border-[var(--line)] text-[var(--text-secondary)]">
                                                        On hold
                                                    </span>
                                                    <span className="text-[11.5px] text-[var(--text-muted)]">
                                                        Ep {p.current_episode}{" "}
                                                        of{" "}
                                                        {s.total_episodes ??
                                                            "?"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-[11.5px] text-[var(--text-secondary)]">
                                                    {s.hidden
                                                        ? "Currently unavailable"
                                                        : `Ep ${p.current_episode} of ${s.total_episodes ?? "?"}`}
                                                </p>
                                            )}
                                            {s.total_episodes && (
                                                <ProgressBar
                                                    value={p.current_episode}
                                                    max={s.total_episodes}
                                                    size="sm"
                                                    label="Watch progress"
                                                />
                                            )}
                                            {!s.hidden &&
                                                (onHold ? (
                                                    <ResumeButton
                                                        seriesId={s.id}
                                                        currentEpisode={
                                                            p.current_episode
                                                        }
                                                        className={buttonClasses(
                                                            {
                                                                variant:
                                                                    "secondary",
                                                                size: "sm",
                                                                full: true,
                                                            },
                                                        )}
                                                    />
                                                ) : (
                                                    (!s.total_episodes ||
                                                        p.current_episode <
                                                            s.total_episodes) && (
                                                        <LogEpisodeButton
                                                            seriesId={s.id}
                                                            seriesTitle={
                                                                s.title
                                                            }
                                                            episodeNumber={
                                                                p.current_episode +
                                                                1
                                                            }
                                                            label={
                                                                atFinale
                                                                    ? "Finish series"
                                                                    : `Log ep ${p.current_episode + 1}`
                                                            }
                                                            className={buttonClasses(
                                                                {
                                                                    size: "sm",
                                                                    full: true,
                                                                },
                                                            )}
                                                        />
                                                    )
                                                ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {movieItems.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10.5px] uppercase tracking-[0.13em] text-[var(--text-secondary)]">
                                    Movies
                                </span>
                                <span className="text-[11.5px] text-[var(--text-muted)]">
                                    watched or not — no episode counts
                                </span>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {movieItems.map(({ series: s, progress: p }) => {
                                    const watched = p.current_episode === 1;
                                    return (
                                        <div
                                            key={s.id}
                                            className={`tdx-panel p-3 flex items-center gap-3 border-l-[3px] ${
                                                watched
                                                    ? "border-l-[var(--accent-primary)]"
                                                    : "border-l-[var(--line)]"
                                            }`}
                                        >
                                            <FilmSlate
                                                size={22}
                                                className={
                                                    watched
                                                        ? "text-[var(--accent-primary)]"
                                                        : "text-[var(--text-muted)]"
                                                }
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/series/${s.id}`}
                                                    className="tdx-focus-ring text-[13.5px] font-medium hover:text-[var(--accent-primary)] transition-colors"
                                                >
                                                    {s.title}
                                                </Link>
                                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">
                                                    {[
                                                        s.release_year,
                                                        watched
                                                            ? `${CATEGORY_LABEL[s.category] ?? ""} movie`.trim()
                                                            : "Plan to watch",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>
                                            </div>
                                            {watched ? (
                                                <span className="inline-flex items-center gap-1 text-[11.5px] text-[var(--accent-primary)]">
                                                    <CheckCircle
                                                        size={14}
                                                        weight="fill"
                                                    />
                                                    Watched
                                                </span>
                                            ) : (
                                                <MarkWatchedButton
                                                    seriesId={s.id}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="flex flex-col gap-4">
                    <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                        <div className="tdx-eyebrow">Rank · tokusatsu only</div>
                        <div className="text-[22px] font-medium mt-1 tracking-[-0.01em]">
                            {rankCurrent.title}
                        </div>
                        <div className="mt-3">
                            <ProgressBar
                                value={rankPct}
                                max={100}
                                size="sm"
                                label={`${rankPct}% to next rank`}
                            />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[11px] text-[var(--text-secondary)]">
                            <span>{tokuEpisodesLogged} episodes logged</span>
                            <span>
                                {rankNext
                                    ? `${rankNext.title} at ${rankNext.min}`
                                    : "Max rank"}
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                            Anime and movies count in totals, not in ranks.
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                        <div className="tdx-eyebrow">Tracker</div>
                        <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 mt-3.5">
                            <div>
                                <div className="text-2xl font-medium leading-none text-[var(--accent-text)]">
                                    {items.length}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                                    Titles tracked
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-medium leading-none text-[var(--accent-text)]">
                                    {episodes}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                                    Episodes watched
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-medium leading-none">
                                    {stats.completed}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                                    Titles completed
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-medium leading-none">
                                    {moviesWatched}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                                    Movies watched
                                </div>
                            </div>
                        </div>
                        <div className="mt-3.5 pt-3 border-t border-[var(--line)] text-[11.5px] text-[var(--text-secondary)]">
                            {stats.watching} watching · {stats.on_hold} on
                            hold · {stats.plan_to_watch} planned
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                        <div className="flex items-baseline gap-2">
                            <span className="tdx-eyebrow">Awards</span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                                {earnedCount} of {milestones.length}
                            </span>
                            <Link
                                href="/achievements"
                                className="ml-auto text-[11.5px] text-[var(--accent-primary)]"
                            >
                                All →
                            </Link>
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-3.5">
                            {milestones.slice(0, 5).map((m, i) => {
                                const Icon =
                                    MILESTONE_ICONS[i % MILESTONE_ICONS.length];
                                return (
                                    <div
                                        key={m.key}
                                        className={`aspect-square rounded-md grid place-items-center text-base ${
                                            m.earned
                                                ? "bg-[var(--accent-tint)] text-[var(--accent-on)]"
                                                : "bg-[var(--sunk)] text-[var(--text-muted)]"
                                        }`}
                                    >
                                        {m.earned ? (
                                            <Icon weight="fill" />
                                        ) : (
                                            <LockSimple />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-2.5 text-[11.5px] text-[var(--text-secondary)] leading-[1.45]">
                            {lastEarned ? `${lastEarned.label} earned. ` : ""}
                            {nextMilestone ? (
                                <>
                                    <span className="text-[var(--text-primary)]">
                                        {nextMilestone.target -
                                            nextMilestone.current}
                                    </span>{" "}
                                    to {nextMilestone.label}.
                                </>
                            ) : (
                                "All milestones unlocked."
                            )}
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                        <div className="tdx-eyebrow">Your submissions</div>
                        {submissionCounts.pending +
                            submissionCounts.published +
                            submissionCounts.rejected >
                        0 ? (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {submissionCounts.pending > 0 && (
                                    <span className="tdx-chip tdx-chip-warn text-[11.5px]">
                                        {submissionCounts.pending} pending
                                    </span>
                                )}
                                {submissionCounts.published > 0 && (
                                    <span className="tdx-chip tdx-chip-ok text-[11.5px]">
                                        {submissionCounts.published} published
                                    </span>
                                )}
                                {submissionCounts.rejected > 0 && (
                                    <span className="tdx-chip text-[11.5px]">
                                        {submissionCounts.rejected} rejected
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="mt-2.5 text-[11.5px] text-[var(--text-secondary)] leading-[1.45]">
                                Missing a title? Add it and an admin will
                                check it over.
                            </p>
                        )}
                        <Link
                            href="/community"
                            className="block mt-3 text-[11.5px] text-[var(--accent-primary)]"
                        >
                            Open my submissions →
                        </Link>
                    </div>
                </aside>
            </div>
            <div className="mt-6">
                <SupportBanner />
            </div>
        </div>
    );
}
