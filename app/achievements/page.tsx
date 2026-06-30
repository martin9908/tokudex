import { redirect } from "next/navigation";
import Link from "next/link";
import { getAchievementsView } from "@/lib/achievementState";

export const metadata = {
    title: "Achievements — TokuDex",
};

function earnedDate(iso?: string): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString();
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
              ((episodesLogged - rankCurrent.min) / (rankNext.min - rankCurrent.min)) * 100
          )
        : 100;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-10 w-full space-y-4">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
                    <p className="text-sm text-cyan-200/70 mt-1">
                        {earnedCount}/{totalCount} unlocked
                    </p>
                </div>
                <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
                    ← Home
                </Link>
            </div>

            {/* Rank */}
            <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="text-lg font-semibold">Rank</h2>
                    <span className="rounded-full border border-cyan-600/40 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-200">
                        {rankCurrent.title}
                    </span>
                </div>
                <div
                    role="progressbar"
                    aria-valuenow={rankPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={rankNext ? `${rankPct}% to ${rankNext.title}` : "Max rank"}
                    className="h-2 w-full rounded-full bg-cyan-950/80 overflow-hidden"
                >
                    <div className="h-full bg-cyan-400" style={{ width: `${rankPct}%` }} />
                </div>
                <p className="mt-2 text-xs text-cyan-200/70">
                    {rankNext
                        ? `${episodesLogged} / ${rankNext.min} episodes logged → ${rankNext.title}`
                        : `${episodesLogged} episodes logged · max rank reached 🎉`}
                </p>
            </section>

            <AchievementGrid
                title="Milestones"
                items={milestones.map((m) => ({
                    key: `ach-${m.key}`,
                    title: m.label,
                    description: m.description,
                    earned: m.earned,
                    current: m.current,
                    target: m.target,
                }))}
                earnedAt={earnedAt}
            />

            <AchievementGrid
                title="Franchise Trophies"
                items={collections.map((c) => ({
                    key: `col-${c.key}`,
                    title: c.title,
                    description: c.description,
                    earned: c.earned,
                    current: c.current,
                    target: c.target,
                }))}
                earnedAt={earnedAt}
                gold
            />

            <AchievementGrid
                title="Series Badges"
                items={seriesBadges.map((b) => ({
                    key: b.key,
                    title: b.name,
                    description: "Finish this series",
                    earned: b.earned,
                    current: b.earned ? 1 : 0,
                    target: 1,
                }))}
                earnedAt={earnedAt}
                gold
            />
        </div>
    );
}

type GridItem = {
    key: string;
    title: string;
    description: string;
    earned: boolean;
    current: number;
    target: number;
};

function AchievementGrid({
    title,
    items,
    earnedAt,
    gold = false,
}: {
    title: string;
    items: GridItem[];
    earnedAt: Record<string, string>;
    gold?: boolean;
}) {
    const earnedBorder = gold ? "border-amber-400/45 bg-amber-400/10" : "border-cyan-500/45 bg-cyan-500/10";
    const icon = gold ? "🏆" : "🏅";

    return (
        <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 md:p-5">
            <h2 className="text-lg font-semibold mb-3">{title}</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((a) => {
                    const date = earnedDate(earnedAt[a.key]);
                    return (
                        <li
                            key={a.key}
                            className={`rounded-xl border p-3 ${
                                a.earned ? earnedBorder : "border-cyan-900/45 bg-[#081a2b]/60"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span aria-hidden>{a.earned ? icon : "🔒"}</span>
                                <p
                                    className={`text-sm font-semibold ${
                                        a.earned ? "text-cyan-50" : "text-cyan-100/60"
                                    }`}
                                >
                                    {a.title}
                                </p>
                            </div>
                            <p className="mt-1 text-xs text-cyan-200/70">{a.description}</p>
                            {a.earned ? (
                                date && (
                                    <p className="mt-1 text-[11px] text-cyan-300/70">Earned {date}</p>
                                )
                            ) : (
                                a.target > 1 && (
                                    <p className="mt-1 text-[11px] text-cyan-300/70">
                                        {a.current}/{a.target}
                                    </p>
                                )
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
