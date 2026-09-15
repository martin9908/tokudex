import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Medal,
    Trophy,
    SealCheck,
    LockSimple,
    HourglassMedium,
} from "@phosphor-icons/react/ssr";
import { getAchievementsView } from "@/lib/achievementState";
import { RANKS } from "@/lib/achievements";
import { STATS_SHARE_KEY } from "@/lib/share";
import { ProgressBar, buttonClasses } from "../components/atoms";
import ShareButton from "../components/molecules/ShareButton";

export const metadata = {
    title: "Achievements",
};

function earnedDate(iso?: string): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
    });
}

type CardItem = {
    key: string;
    title: string;
    description: string;
    earned: boolean;
    current: number;
    target: number;
};

/** Milestone / trophy card — accent rule on the left once it's unlocked. */
function AchievementCard({
    item,
    earnedAt,
    icon,
}: {
    item: CardItem;
    earnedAt?: string;
    icon: "medal" | "trophy";
}) {
    const date = earnedDate(earnedAt);
    const EarnedIcon = icon === "medal" ? Medal : Trophy;
    return (
        <li
            className={`tdx-panel p-3.5 ${item.earned ? "border-l-[3px] border-l-[var(--accent-primary)]" : ""}`}
        >
            <div className="flex items-center gap-2.5">
                {item.earned ? (
                    <EarnedIcon
                        size={18}
                        weight="fill"
                        className="text-[var(--accent-primary)] flex-none"
                        aria-hidden
                    />
                ) : icon === "trophy" ? (
                    <Trophy size={18} className="text-[var(--text-muted)] flex-none" aria-hidden />
                ) : (
                    <HourglassMedium size={18} className="text-[var(--text-muted)] flex-none" aria-hidden />
                )}
                <p
                    className={`text-[13.5px] font-medium ${item.earned ? "" : "text-[var(--text-secondary)]"}`}
                >
                    {item.title}
                </p>
            </div>
            <p className="text-[11.5px] text-[var(--text-secondary)] mt-1.5">
                {item.description}
            </p>
            {item.earned ? (
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <p className="text-[11px] text-[var(--accent-primary)]">
                        {date ? `Unlocked ${date}` : "Unlocked"}
                    </p>
                    <ShareButton
                        shareKey={item.key}
                        variant="ghost"
                        text={`I unlocked "${item.title}" on TokuDex!`}
                        className="ml-auto"
                    />
                </div>
            ) : (
                item.target > 1 && (
                    <>
                        <ProgressBar
                            value={item.current}
                            max={item.target}
                            muted
                            className="mt-2.5"
                            label={`${item.current} of ${item.target}`}
                        />
                        <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                            {item.current} / {item.target}
                        </p>
                    </>
                )
            )}
        </li>
    );
}

export default async function AchievementsPage() {
    const view = await getAchievementsView();
    if (!view) redirect("/login");

    const {
        episodesLogged,
        rankCurrent,
        rankNext,
        milestones,
        collections,
        seriesBadges,
        earnedAt,
        earnedCount,
        totalCount,
    } = view;

    const rankPct = rankNext
        ? Math.round(
              ((episodesLogged - rankCurrent.min) /
                  (rankNext.min - rankCurrent.min)) *
                  100,
          )
        : 100;
    const earnedBadges = seriesBadges.filter((b) => b.earned);
    const lockedBadges = seriesBadges.filter((b) => !b.earned);
    const previewLocked = Math.max(0, 6 - earnedBadges.length);
    const shownBadges = [...earnedBadges, ...lockedBadges.slice(0, previewLocked)];
    const remainingBadges = lockedBadges.slice(previewLocked);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 w-full flex flex-col gap-5">
            <div className="flex items-end gap-3 flex-wrap">
                <div>
                    <h1 className="text-[24px] tracking-[-0.02em]">Achievements</h1>
                    <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                        {earnedCount} of {totalCount} unlocked
                    </p>
                </div>
                <Link
                    href="/invite"
                    className={buttonClasses({
                        variant: "secondary",
                        size: "sm",
                        className: "ml-auto",
                    })}
                >
                    Invite friends
                </Link>
            </div>

            <section className="tdx-panel p-4">
                <div className="flex items-center gap-2.5">
                    <span className="tdx-eyebrow">Rank</span>
                    <span className="tdx-chip tdx-chip-accent ml-auto text-[11.5px]">
                        {rankCurrent.title}
                    </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-[26px] font-medium leading-none">
                        {episodesLogged}
                    </span>
                    <span className="text-[12.5px] text-[var(--text-secondary)]">
                        tokusatsu episodes logged
                    </span>
                </div>
                <ProgressBar
                    value={rankPct}
                    max={100}
                    size="md"
                    className="mt-3"
                    label={rankNext ? `${rankPct}% to ${rankNext.title}` : "Max rank"}
                />
                <div className="flex justify-between mt-1.5 text-[11.5px] text-[var(--text-secondary)]">
                    <span>
                        {rankNext
                            ? `${rankPct}% to ${rankNext.title}`
                            : "Max rank reached"}
                    </span>
                    <span>{rankNext ? `${rankNext.min} episodes` : ""}</span>
                </div>
                <div className="flex gap-2 mt-3.5 flex-wrap items-start">
                    <ShareButton
                        shareKey={STATS_SHARE_KEY}
                        kind="stats"
                        size="md"
                        label="Share my stats"
                        text={`I'm rank ${rankCurrent.title} with ${episodesLogged} episodes logged on TokuDex!`}
                    />
                    <details className="relative">
                        <summary className={buttonClasses({ variant: "secondary", className: "list-none" })}>
                            See all ranks
                        </summary>
                        <ol className="tdx-panel absolute left-0 mt-2 p-2 w-[240px] z-10 flex flex-col">
                            {RANKS.map((r) => (
                                <li
                                    key={r.title}
                                    className={`flex justify-between px-2 py-1.5 rounded text-xs ${
                                        r.title === rankCurrent.title
                                            ? "bg-[var(--accent-tint)] text-[var(--accent-on)]"
                                            : "text-[var(--text-secondary)]"
                                    }`}
                                >
                                    <span>{r.title}</span>
                                    <span className="tabular-nums">{r.min}+</span>
                                </li>
                            ))}
                        </ol>
                    </details>
                </div>
            </section>

            <section>
                <div className="flex items-baseline gap-2.5 mb-2.5">
                    <h2 className="text-sm font-medium">Milestones</h2>
                    <span className="text-[11.5px] text-[var(--text-muted)]">
                        {milestones.filter((m) => m.earned).length} of {milestones.length}
                    </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {milestones.map((m) => (
                        <AchievementCard
                            key={m.key}
                            icon="medal"
                            earnedAt={earnedAt[`ach-${m.key}`]}
                            item={{
                                key: `ach-${m.key}`,
                                title: m.label,
                                description: m.description,
                                earned: m.earned,
                                current: m.current,
                                target: m.target,
                            }}
                        />
                    ))}
                </ul>
            </section>

            <section>
                <div className="flex items-baseline gap-2.5 mb-2.5">
                    <h2 className="text-sm font-medium">Franchise trophies</h2>
                    <span className="text-[11.5px] text-[var(--text-muted)]">
                        every season in a franchise
                    </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {collections.map((c) => (
                        <AchievementCard
                            key={c.key}
                            icon="trophy"
                            earnedAt={earnedAt[`col-${c.key}`]}
                            item={{
                                key: `col-${c.key}`,
                                title: c.title,
                                description: c.description,
                                earned: c.earned,
                                current: c.current,
                                target: c.target,
                            }}
                        />
                    ))}
                </ul>
            </section>

            <section>
                <div className="flex items-baseline gap-2.5 mb-2.5">
                    <h2 className="text-sm font-medium">Series badges</h2>
                    <span className="text-[11.5px] text-[var(--text-muted)]">
                        one per finished series · {earnedBadges.length} earned
                    </span>
                </div>
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {shownBadges.map((b) => (
                        <li
                            key={b.key}
                            className={`tdx-panel p-3 text-center ${b.earned ? "border-l-[3px] border-l-[var(--accent-primary)]" : ""}`}
                        >
                            {b.earned ? (
                                <SealCheck size={22} weight="fill" className="mx-auto text-[var(--accent-primary)]" aria-hidden />
                            ) : (
                                <LockSimple size={22} className="mx-auto text-[var(--text-muted)]" aria-hidden />
                            )}
                            <p
                                className={`text-xs font-medium mt-2 leading-[1.25] ${b.earned ? "" : "text-[var(--text-secondary)]"}`}
                            >
                                {b.series}
                            </p>
                            <p
                                className={`text-[10.5px] mt-1 ${b.earned ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}
                            >
                                {b.name}
                            </p>
                            {b.earned && (
                                <ShareButton
                                    shareKey={b.key}
                                    variant="ghost"
                                    text={`I finished ${b.series} on TokuDex — badge "${b.name}" unlocked!`}
                                    className="justify-center mt-1.5"
                                />
                            )}
                        </li>
                    ))}
                </ul>
                {remainingBadges.length > 0 && (
                    <details className="mt-3">
                        <summary className="tdx-focus-ring grid place-items-center p-3 rounded-lg border border-dashed border-[var(--line)] text-[11.5px] text-[var(--accent-primary)] cursor-pointer list-none">
                            See all {seriesBadges.length}
                        </summary>
                        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                            {remainingBadges.map((b) => (
                                <li key={b.key} className="tdx-panel p-3 text-center">
                                    <LockSimple size={22} className="mx-auto text-[var(--text-muted)]" aria-hidden />
                                    <p className="text-xs font-medium mt-2 leading-[1.25] text-[var(--text-secondary)]">
                                        {b.series}
                                    </p>
                                    <p className="text-[10.5px] mt-1 text-[var(--text-muted)]">
                                        {b.name}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </section>
        </div>
    );
}
