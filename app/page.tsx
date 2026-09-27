import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProgressBySeries } from "@/lib/supabase/queries";
import {
    toWatchItems,
    summarizeProgress,
    shortWhen,
    monthName,
    isQuiet,
    daysAgoIso,
    type WatchItem,
} from "@/lib/progress";
import { episodeTypeLabel } from "@/lib/episodeTypes";
import { getProfile } from "@/lib/profiles";
import {
    PosterImage,
    BigNumber,
    HairlineRule,
    Bar,
    TagChip,
    buttonClasses,
} from "./components/atoms";
import LogEpisodeButton from "./components/organisms/LogEpisodeButton";
import GuestHome from "./components/organisms/GuestHome";
import QuickLogButton from "./components/molecules/QuickLogButton";
import { getGuestSeries } from "@/lib/guest";

function Stat({
    value,
    label,
    hint,
    tone = "mute",
    first = false,
}: {
    value: number;
    label: string;
    hint: string;
    tone?: "text" | "mute";
    first?: boolean;
}) {
    return (
        <div
            className={`flex-none ${first ? "pr-[26px]" : "px-[26px] border-l border-[var(--line)]"}`}
        >
            <div className="flex items-baseline gap-1.5">
                <BigNumber size={27} tone={tone} className="tracking-[-0.035em]">
                    {value.toLocaleString()}
                </BigNumber>
                <span className="text-[12px] text-[var(--text-secondary)]">
                    {label}
                </span>
            </div>
            <div className="text-[11.5px] text-[var(--text-secondary)] mt-[7px] whitespace-nowrap">
                {hint}
            </div>
        </div>
    );
}

function franchiseShort(item: WatchItem["series"]): string {
    const f = item.franchise ?? "";
    if (/sentai/i.test(f)) return "Sentai";
    if (/rider/i.test(f)) return "Rider";
    if (/ultra/i.test(f)) return "Ultra";
    if (item.format === "movie") return "Movie";
    return f || item.category.charAt(0).toUpperCase() + item.category.slice(1);
}

export default async function Home() {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) return <GuestHome />;

    const rows = await getUserProgressBySeries(user.id);
    const items = toWatchItems(rows).filter((i) => !i.series.hidden);
    const stats = summarizeProgress(rows);
    const logged = items.reduce((n, i) => n + i.progress.current_episode, 0);

    const series = items.filter((i) => i.series.format === "series");
    const going = series
        .filter((i) => i.progress.status === "watching")
        .sort(
            (a, b) =>
                new Date(b.progress.last_watched_at).getTime() -
                new Date(a.progress.last_watched_at).getTime(),
        );
    const shelved = series.filter((i) => i.progress.status === "on_hold");
    const upNext = going[0] ?? null;
    const alsoGoing = [...going.slice(1), ...shelved];
    const doneLately = items
        .filter((i) => i.progress.status === "completed")
        .sort(
            (a, b) =>
                new Date(b.progress.last_watched_at).getTime() -
                new Date(a.progress.last_watched_at).getTime(),
        )
        .slice(0, 3);

    const since = daysAgoIso(7);
    const [
        { data: nextEpisode },
        { data: weekRows },
        { data: submissionRows },
        profile,
        suggestions,
    ] = await Promise.all([
        upNext
            ? client
                  .from("episodes")
                  .select("title, synopsis, episode_type, air_date")
                  .eq("series_id", upNext.series.id)
                  .eq("episode_number", upNext.progress.current_episode + 1)
                  .maybeSingle()
            : Promise.resolve({ data: null }),
        client
            .from("activity")
            .select("id")
            .eq("user_id", user.id)
            .in("kind", ["logged", "finished"])
            .gte("created_at", since),
        client
            .from("catalog_submissions")
            .select("status, series_id, base_revision")
            .eq("author_id", user.id),
        getProfile(user.id),
        items.length === 0 ? getGuestSeries() : Promise.resolve([]),
    ]);

    const thisWeek = weekRows?.length ?? 0;
    const activeThisWeek = items.filter(
        (i) => new Date(i.progress.last_watched_at).toISOString() >= since,
    ).length;
    const quiet = going.filter((i) => isQuiet(i.progress.last_watched_at)).length;
    const lastFinished = doneLately[0]?.progress.last_watched_at;
    const someday = items.filter((i) => i.progress.status === "plan_to_watch");
    const oldestSomeday = someday
        .map((i) => i.progress.last_watched_at)
        .sort()[0];
    const corrections = (submissionRows ?? []).filter(
        (s) => s.base_revision !== null,
    );
    const correctionsPending = corrections.filter(
        (s) => s.status === "pending",
    ).length;
    const correctionsRejected = corrections.filter(
        (s) => s.status === "rejected",
    ).length;

    const total = upNext?.series.total_episodes ?? null;
    const current = upNext?.progress.current_episode ?? 0;
    const next = current + 1;
    const nextType = episodeTypeLabel(nextEpisode?.episode_type);
    const lastLogged = upNext ? shortWhen(upNext.progress.last_watched_at) : null;

    return (
        <div className="w-full pb-24 md:pb-10">
            {/* Stat strip */}
            <div className="hidden md:flex items-stretch px-[30px] py-[20px] overflow-x-auto">
                <Stat
                    first
                    value={logged}
                    label="logged"
                    hint={
                        profile?.share_activity === false
                            ? `${activeThisWeek} title${activeThisWeek === 1 ? "" : "s"} active this week`
                            : `${thisWeek} this week`
                    }
                    tone="text"
                />
                <Stat
                    value={stats.watching}
                    label="watching"
                    hint={
                        quiet === 0
                            ? stats.watching === 0
                                ? "pick one from your dex"
                                : "all active"
                            : quiet === 1
                              ? "one gone quiet"
                              : `${quiet} gone quiet`
                    }
                    tone="text"
                />
                <Stat
                    value={stats.completed}
                    label="finished"
                    hint={
                        lastFinished
                            ? `last in ${monthName(lastFinished)}`
                            : "none yet"
                    }
                />
                <Stat
                    value={stats.plan_to_watch}
                    label="someday"
                    hint={
                        oldestSomeday
                            ? `oldest added ${new Date(oldestSomeday).getFullYear()}`
                            : "nothing waiting"
                    }
                />
                <Stat
                    value={corrections.length}
                    label="corrections"
                    hint={
                        corrections.length === 0
                            ? "none sent"
                            : correctionsPending
                              ? `${correctionsPending} pending`
                              : correctionsRejected
                                ? `${correctionsRejected} sent back`
                                : "all accepted"
                    }
                />
                <Link
                    href="/achievements"
                    className="tdx-focus-ring rounded-sm ml-auto pl-[26px] self-center text-[12.5px] text-[var(--text-primary)] whitespace-nowrap"
                >
                    Your year{" "}
                    <span className="text-[var(--accent-primary)]">→</span>
                </Link>
            </div>
            <HairlineRule className="hidden md:block" />

            {items.length === 0 && (
                <section className="px-[18px] md:px-[30px] py-[30px]">
                    <p className="text-[12.5px] text-[var(--text-secondary)]">
                        Empty library · first run
                    </p>
                    <h1 className="text-[22px] font-medium mt-2 tracking-[-0.02em]">
                        Nothing tracked yet
                    </h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1.5 leading-[1.55] max-w-[420px]">
                        Pick a series you&apos;re watching and log the episode
                        you&apos;re on. Everything else — rank, badges,
                        rankings — follows from that.
                    </p>
                    <div className="flex gap-2.5 mt-4 flex-wrap">
                        <Link href="/welcome" className={buttonClasses()}>
                            Get started
                        </Link>
                        <Link
                            href="/community/catalog"
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
                    {suggestions.length > 0 && (
                        <div className="mt-6 flex flex-col">
                            {suggestions.slice(0, 2).map((s, i) => (
                                <Link
                                    key={s.id}
                                    href={`/series/${s.id}`}
                                    className="tdx-focus-ring tdx-row flex items-center gap-3.5 py-3 border-t border-[var(--line)] last:border-b"
                                >
                                    <span className="text-[11.5px] text-[var(--text-secondary)] w-[130px] flex-none">
                                        {i === 0
                                            ? "Popular right now"
                                            : "Good place to start"}
                                    </span>
                                    <span className="text-[13.5px]">
                                        {s.title}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {items.length > 0 && (
                <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] xl:grid-cols-[minmax(0,1fr)_420px]">
                    {/* Up next */}
                    <section className="px-[18px] pt-[20px] pb-[8px] md:p-[30px] md:border-r md:border-[var(--line)]">
                        {upNext ? (
                            <>
                                <p className="text-[12.5px] text-[var(--text-secondary)] md:hidden">
                                    Up next
                                </p>
                                <div className="flex gap-[26px] md:mt-0">
                                    <Link
                                        href={`/series/${upNext.series.id}`}
                                        className="tdx-focus-ring hidden md:block relative w-[188px] aspect-[3/4] flex-none rounded-md overflow-hidden"
                                    >
                                        <PosterImage
                                            src={upNext.series.cover_image_url}
                                            alt={upNext.series.title}
                                            sizes="188px"
                                        />
                                    </Link>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <Link
                                            href={`/series/${upNext.series.id}`}
                                            className="tdx-focus-ring hidden md:block rounded-sm text-[11.5px] tracking-[0.34em] uppercase text-[var(--text-secondary)] font-medium"
                                        >
                                            {upNext.series.title}
                                        </Link>
                                        <div className="flex items-start gap-[14px] md:gap-4 mt-3 md:mt-5">
                                            <BigNumber
                                                size={46}
                                                className="md:hidden leading-[0.9]"
                                            >
                                                {next}
                                            </BigNumber>
                                            <BigNumber
                                                size={74}
                                                className="hidden md:inline"
                                            >
                                                {next}
                                            </BigNumber>
                                            <div className="flex-1 min-w-0 pt-1 md:pt-1.5">
                                                <Link
                                                    href={`/series/${upNext.series.id}`}
                                                    className="tdx-focus-ring md:hidden block text-[15px] font-medium leading-[1.25]"
                                                >
                                                    {upNext.series.title}
                                                </Link>
                                                <p className="text-[12px] text-[var(--text-secondary)] mt-[5px] md:mt-0 md:text-[17px] md:text-[var(--text-primary)] md:leading-[1.3] md:tracking-[-0.01em]">
                                                    {nextEpisode?.title ??
                                                        `Episode ${next}`}
                                                </p>
                                                <div className="flex gap-1.5 mt-[9px] flex-wrap">
                                                    <TagChip accent>
                                                        {nextType ?? "Arc"}
                                                    </TagChip>
                                                    {nextEpisode?.air_date && (
                                                        <TagChip>
                                                            {new Date(
                                                                nextEpisode.air_date,
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                },
                                                            )}
                                                        </TagChip>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 md:mt-[26px]">
                                            {total ? (
                                                <Bar
                                                    value={current}
                                                    max={total}
                                                    label="Watch progress"
                                                />
                                            ) : null}
                                            <div className="flex justify-between mt-2 text-[11.5px] md:text-[12px] text-[var(--text-secondary)]">
                                                <span>
                                                    {total
                                                        ? `${current} down, ${total - current} to go`
                                                        : `${current} logged`}
                                                </span>
                                                {lastLogged && (
                                                    <span>
                                                        Last logged {lastLogged}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-[9px] mt-4 md:mt-[22px]">
                                            {(!total || current < total) && (
                                                <LogEpisodeButton
                                                    seriesId={upNext.series.id}
                                                    seriesTitle={
                                                        upNext.series.title
                                                    }
                                                    episodeNumber={next}
                                                    episodeTitle={
                                                        nextEpisode?.title
                                                    }
                                                    episodeSynopsis={
                                                        nextEpisode?.synopsis
                                                    }
                                                    episodeType={
                                                        nextEpisode?.episode_type
                                                    }
                                                    label={`Log ${next}`}
                                                    className={buttonClasses({
                                                        className:
                                                            "flex-1 md:flex-none min-h-[46px] md:min-h-[40px] md:px-4",
                                                    })}
                                                />
                                            )}
                                            <Link
                                                href={`/series/${upNext.series.id}`}
                                                className={buttonClasses({
                                                    variant: "secondary",
                                                    className:
                                                        "min-h-[46px] md:min-h-[36px]",
                                                })}
                                            >
                                                <span className="md:hidden">
                                                    Episodes
                                                </span>
                                                <span className="hidden md:inline">
                                                    Episode list
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <p className="text-[12.5px] text-[var(--text-secondary)]">
                                    Nothing on the go
                                </p>
                                <p className="text-[17px] mt-2 leading-[1.3]">
                                    Everything you track is finished, shelved or
                                    waiting for someday.
                                </p>
                                <div className="flex gap-2.5 mt-4 flex-wrap">
                                    <Link
                                        href="/series"
                                        className={buttonClasses()}
                                    >
                                        Open your dex
                                    </Link>
                                    <Link
                                        href="/community/catalog"
                                        className={buttonClasses({
                                            variant: "secondary",
                                        })}
                                    >
                                        Browse the catalog
                                    </Link>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Also going / Done lately */}
                    <aside className="md:px-[26px] md:py-[30px]">
                        <HairlineRule className="md:hidden" inset={34} />
                        <p className="text-[12.5px] text-[var(--text-secondary)] px-[18px] pt-[18px] pb-2 md:p-0">
                            Also going
                        </p>
                        {alsoGoing.length === 0 ? (
                            <p className="text-[12px] text-[var(--text-muted)] px-[18px] md:px-0 md:mt-3">
                                Just the one for now.
                            </p>
                        ) : (
                            <div className="flex flex-col md:mt-[14px]">
                                {alsoGoing.map(({ series: s, progress: p }) => {
                                    const onHold = p.status === "on_hold";
                                    const ep = p.current_episode + 1;
                                    const done =
                                        s.total_episodes !== null &&
                                        p.current_episode >= s.total_episodes;
                                    return (
                                        <div
                                            key={s.id}
                                            className="tdx-row flex items-center gap-[13px] px-[18px] md:px-0 py-[11px] min-h-[48px]"
                                        >
                                            <BigNumber
                                                size={19}
                                                tone={onHold ? "dim" : "mute"}
                                                className="md:hidden w-[34px] leading-none"
                                            >
                                                {ep}
                                            </BigNumber>
                                            <BigNumber
                                                size={26}
                                                tone={onHold ? "dim" : "mute"}
                                                className="hidden md:inline"
                                            >
                                                {ep}
                                            </BigNumber>
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/series/${s.id}`}
                                                    className={`tdx-focus-ring block rounded-sm text-[13px] md:text-[13px] truncate ${onHold ? "md:text-[var(--text-secondary)]" : ""}`}
                                                >
                                                    {s.title}
                                                </Link>
                                                {onHold ? (
                                                    <p className="text-[11px] md:text-[11px] text-[var(--text-secondary)] mt-[3px]">
                                                        Shelved at{" "}
                                                        {p.current_episode}
                                                        {monthName(
                                                            p.last_watched_at,
                                                        )
                                                            ? ` · nothing since ${monthName(p.last_watched_at)}`
                                                            : ""}
                                                    </p>
                                                ) : (
                                                    <>
                                                        <p className="md:hidden text-[11.5px] text-[var(--text-secondary)] mt-[3px]">
                                                            {p.current_episode} of{" "}
                                                            {s.total_episodes ??
                                                                "?"}{" "}
                                                            · {franchiseShort(s)}
                                                            {s.release_year
                                                                ? ` · ${s.release_year}`
                                                                : ""}
                                                        </p>
                                                        {s.total_episodes ? (
                                                            <Bar
                                                                value={
                                                                    p.current_episode
                                                                }
                                                                max={
                                                                    s.total_episodes
                                                                }
                                                                className="hidden md:block mt-[7px]"
                                                            />
                                                        ) : null}
                                                    </>
                                                )}
                                            </div>
                                            {!done && (
                                                <div className="md:hidden">
                                                    <QuickLogButton
                                                        seriesId={s.id}
                                                        episode={ep}
                                                        dim={onHold}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {doneLately.length > 0 && (
                            <div className="hidden md:block">
                                <HairlineRule className="my-[18px]" />
                                <p className="text-[12.5px] text-[var(--text-secondary)]">
                                    Done lately
                                </p>
                                <div className="flex flex-col gap-[11px] mt-[13px] text-[13px]">
                                    {doneLately.map(({ series: s }) => (
                                        <Link
                                            key={s.id}
                                            href={`/series/${s.id}`}
                                            className="tdx-focus-ring rounded-sm flex items-baseline gap-[9px]"
                                        >
                                            <span className="flex-1 min-w-0 truncate">
                                                {s.title}
                                            </span>
                                            <span className="text-[11.5px] text-[var(--accent-primary)]">
                                                {s.format === "movie"
                                                    ? "Watched"
                                                    : s.total_episodes
                                                      ? `All ${s.total_episodes}`
                                                      : "Done"}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            )}
        </div>
    );
}
