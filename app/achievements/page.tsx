import { redirect } from "next/navigation";
import Link from "next/link";
import { getAchievementsView } from "@/lib/achievementState";
import { RANKS } from "@/lib/achievements";
import { STATS_SHARE_KEY } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import { BigNumber, Bar, HairlineRule, buttonClasses } from "../components/atoms";
import ShareButton from "../components/molecules/ShareButton";

export const metadata = {
    title: "Awards",
};

function earnedDate(iso?: string): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
    });
}

/** "Ohsama Sentai King-Ohger" → "King-Ohger" for the badge chips. */
function shortTitle(title: string): string {
    const stripped = title.replace(/^(?:\S+\s+Sentai|Kamen Rider|Ultraman)\s+/i, "").trim();
    // Keep the franchise for one-letter survivors like "Ultraman Z" or "Kamen Rider W".
    return stripped.length > 2 ? stripped : title;
}

function sentence(parts: string[]): string {
    return parts.filter(Boolean).join(" ");
}

export default async function AwardsPage() {
    const view = await getAchievementsView();
    if (!view) redirect("/login");

    const {
        episodesLogged,
        rankCurrent,
        rankNext,
        milestones,
        collections,
        earnedAt,
    } = view;

    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    const { data: rows } = user
        ? await client
              .from("user_series_progress")
              .select(
                  "current_episode, status, last_watched_at, series(id, title, total_episodes, format, hidden)",
              )
              .eq("user_id", user.id)
        : { data: null };
    type Row = {
        current_episode: number;
        status: string;
        last_watched_at: string;
        series: {
            id: string;
            title: string;
            total_episodes: number | null;
            format: string;
            hidden: boolean;
        } | null;
    };
    const tracked = ((rows ?? []) as unknown as Row[]).filter(
        (r) => r.series && !r.series.hidden && r.series.format === "series",
    );
    const finished = tracked
        .filter((r) => r.status === "completed")
        .sort(
            (a, b) =>
                new Date(b.last_watched_at).getTime() -
                new Date(a.last_watched_at).getTime(),
        );
    const inProgress = tracked
        .filter((r) => r.status === "watching" && r.current_episode > 0)
        .sort((a, b) => b.current_episode - a.current_episode)[0];

    const earnedMilestones = milestones.filter((m) => m.earned).length;
    const earnedTrophies = collections.filter((c) => c.earned);
    const nearestTrophy = collections
        .filter((c) => !c.earned && c.current > 0)
        .sort((a, b) => b.current / b.target - a.current / a.target)[0];
    const toNext = rankNext ? rankNext.min - episodesLogged : 0;

    const summary = sentence([
        finished.length === 0
            ? "Nothing finished yet — the first badge unlocks with the last episode of any series."
            : `${finished.length === 1 ? "One series" : `${finished.length} series`} finished.`,
        earnedTrophies.length
            ? `${earnedTrophies.map((c) => c.title).slice(0, 2).join(" and ")} ${earnedTrophies.length === 1 ? "is" : "are"} yours${earnedTrophies.length > 2 ? `, with ${earnedTrophies.length - 2} more` : ""}.`
            : "",
        nearestTrophy
            ? `${nearestTrophy.target - nearestTrophy.current} short of ${nearestTrophy.title}${inProgress ? `, and ${inProgress.series!.title} is still going.` : "."}`
            : inProgress
              ? `${inProgress.series!.title} is the closest to done.`
              : "",
    ]);

    return (
        <div className="w-full pb-24 md:pb-10">
            <div className="grid md:grid-cols-[2fr_1fr]">
                <section className="px-[18px] md:px-[30px] pt-[26px] md:pt-8 pb-6 md:pb-8 md:border-r md:border-[var(--line)]">
                    <p className="text-[11.5px] tracking-[0.34em] uppercase text-[var(--text-secondary)] font-medium">
                        {rankCurrent.title}
                    </p>
                    <div className="flex items-baseline gap-[14px] mt-5">
                        <BigNumber size={68}>{episodesLogged.toLocaleString()}</BigNumber>
                        <span className="text-[14px] text-[var(--text-secondary)]">
                            episodes logged
                        </span>
                    </div>
                    <div className="mt-6">
                        <Bar
                            value={episodesLogged - rankCurrent.min}
                            max={rankNext ? rankNext.min - rankCurrent.min : 1}
                            label={rankNext ? `Progress to ${rankNext.title}` : "Top rank"}
                        />
                        <div className="flex justify-between mt-2 text-[12px] text-[var(--text-secondary)]">
                            <span>
                                {rankNext
                                    ? `${toNext.toLocaleString()} more and you're a ${rankNext.title}`
                                    : "Top of the ladder"}
                            </span>
                            <span>{rankNext ? rankNext.min.toLocaleString() : ""}</span>
                        </div>
                    </div>
                    <div className="flex gap-[9px] mt-6 flex-wrap items-start">
                        <ShareButton
                            shareKey={STATS_SHARE_KEY}
                            kind="stats"
                            size="md"
                            label="Share this"
                            text={`I'm rank ${rankCurrent.title} with ${episodesLogged} episodes logged on TokuDex!`}
                        />
                        <details className="relative">
                            <summary
                                className={buttonClasses({
                                    variant: "secondary",
                                    className: "list-none",
                                })}
                            >
                                Every rank
                            </summary>
                            <ol className="absolute left-0 mt-2 p-2 w-[240px] z-10 flex flex-col rounded-lg border border-[var(--line)] bg-[var(--background)]">
                                {RANKS.map((r) => (
                                    <li
                                        key={r.title}
                                        className={`flex justify-between px-2 py-1.5 rounded text-xs ${
                                            r.title === rankCurrent.title
                                                ? "text-[var(--accent-primary)]"
                                                : "text-[var(--text-secondary)]"
                                        }`}
                                    >
                                        <span>{r.title}</span>
                                        <span className="tabular-nums">{r.min}+</span>
                                    </li>
                                ))}
                            </ol>
                        </details>
                        <Link
                            href="/invite"
                            className={buttonClasses({ variant: "ghost" })}
                        >
                            Invite friends
                        </Link>
                    </div>
                </section>
                <aside className="px-[18px] md:px-[26px] pb-6 md:py-8 text-[12.5px] text-[var(--text-secondary)] leading-[1.7]">
                    {summary}
                </aside>
            </div>
            <HairlineRule />

            <div className="flex items-baseline gap-[14px] px-[18px] md:px-[30px] pt-[22px] pb-[14px]">
                <h2 className="text-[14px] font-medium">Milestones</h2>
                <span className="text-[12px] text-[var(--text-secondary)]">
                    {earnedMilestones} of {milestones.length}
                </span>
            </div>
            <div className="flex flex-col">
                {milestones.map((m) => {
                    const date = earnedDate(earnedAt[`ach-${m.key}`]);
                    return (
                        <div
                            key={m.key}
                            className="tdx-row rounded-none grid grid-cols-[1fr_130px] gap-[18px] items-center px-[18px] md:px-[30px] py-3"
                        >
                            <div className="min-w-0">
                                <p
                                    className={`text-[13.5px] ${m.earned ? "" : "text-[var(--text-secondary)]"}`}
                                >
                                    {m.label}
                                </p>
                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
                                    {m.description}
                                </p>
                            </div>
                            <div className="text-right text-[12px] whitespace-nowrap tabular-nums flex items-center justify-end gap-2">
                                {m.earned ? (
                                    <>
                                        <span className="text-[var(--accent-primary)]">
                                            {date ?? "Unlocked"}
                                        </span>
                                        <ShareButton
                                            shareKey={`ach-${m.key}`}
                                            variant="ghost"
                                            text={`I unlocked "${m.label}" on TokuDex!`}
                                        />
                                    </>
                                ) : (
                                    <span className="text-[var(--text-secondary)]">
                                        {m.current} / {m.target}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <HairlineRule />

            <div className="flex items-baseline gap-[14px] px-[18px] md:px-[30px] pt-[22px] pb-[14px]">
                <h2 className="text-[14px] font-medium">Finished</h2>
                <span className="text-[12px] text-[var(--text-secondary)]">
                    {finished.length === 0
                        ? "No badges yet"
                        : `${finished.length} badge${finished.length === 1 ? "" : "s"}`}
                </span>
            </div>
            <div className="flex flex-wrap gap-[9px] px-[18px] md:px-[30px] pb-[26px] text-[12.5px]">
                {finished.map((r) => (
                    <Link
                        key={r.series!.id}
                        href={`/series/${r.series!.id}`}
                        className="tdx-focus-ring px-[11px] py-[6px] rounded-md border border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    >
                        {shortTitle(r.series!.title)}
                        {r.series!.total_episodes ? ` · ${r.series!.total_episodes}` : ""}
                    </Link>
                ))}
                {inProgress && (
                    <Link
                        href={`/series/${inProgress.series!.id}`}
                        className="tdx-focus-ring px-[11px] py-[6px] rounded-md text-[var(--text-secondary)]"
                    >
                        {shortTitle(inProgress.series!.title)} · {inProgress.current_episode}
                        {inProgress.series!.total_episodes
                            ? ` of ${inProgress.series!.total_episodes}`
                            : ""}
                    </Link>
                )}
                {finished.length === 0 && !inProgress && (
                    <span className="text-[12px] text-[var(--text-muted)]">
                        Finish a series and its badge lands here.
                    </span>
                )}
            </div>
            <HairlineRule />

            <div className="flex items-baseline gap-[14px] px-[18px] md:px-[30px] pt-[22px] pb-[14px]">
                <h2 className="text-[14px] font-medium">Franchise trophies</h2>
                <span className="text-[12px] text-[var(--text-secondary)]">
                    every season in a franchise
                </span>
            </div>
            <div className="flex flex-col pb-6">
                {collections.map((c) => {
                    const date = earnedDate(earnedAt[`col-${c.key}`]);
                    return (
                        <div
                            key={c.key}
                            className="tdx-row rounded-none grid grid-cols-[1fr_130px] gap-[18px] items-center px-[18px] md:px-[30px] py-3"
                        >
                            <div className="min-w-0">
                                <p
                                    className={`text-[13.5px] ${c.earned ? "" : "text-[var(--text-secondary)]"}`}
                                >
                                    {c.title}
                                </p>
                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
                                    {c.description}
                                </p>
                            </div>
                            <div className="text-right text-[12px] whitespace-nowrap tabular-nums flex items-center justify-end gap-2">
                                {c.earned ? (
                                    <>
                                        <span className="text-[var(--accent-primary)]">
                                            {date ?? "Unlocked"}
                                        </span>
                                        <ShareButton
                                            shareKey={`col-${c.key}`}
                                            variant="ghost"
                                            text={`I earned the "${c.title}" trophy on TokuDex!`}
                                        />
                                    </>
                                ) : (
                                    <span className="text-[var(--text-secondary)]">
                                        {c.current} / {c.target}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
