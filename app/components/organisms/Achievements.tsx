import Link from "next/link";
import {
    getRank,
    getAchievements,
    countEarned,
} from "@/lib/achievements";
import { Badge, ProgressBar } from "../atoms";

type AchievementsProps = {
    seriesTracked: number;
    episodesLogged: number;
    seriesCompleted: number;
    referralCount?: number;
};

export default function Achievements({
    seriesTracked,
    episodesLogged,
    seriesCompleted,
    referralCount = 0,
}: AchievementsProps) {
    const { current, next } = getRank(episodesLogged);
    const achievements = getAchievements({ seriesTracked, episodesLogged, seriesCompleted, referralCount });
    const earned = countEarned(achievements);

    const rankPct = next
        ? Math.round(
            ((episodesLogged - current.min) / (next.min - current.min)) * 100
        )
        : 100;

    return (
        <section className="tdx-panel p-4 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold">Achievements</h2>
                    <Link href="/achievements" className="text-sm text-cyan-300 hover:text-cyan-200">
                        View all
                    </Link>
                </div>
                <Badge variant="info" pill>{current.title}</Badge>
            </div>

            {next ? (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-cyan-200/70 mb-1">
                        <span>{earned}/{achievements.length} unlocked</span>
                        <span>{episodesLogged} / {next.min} eps → {next.title}</span>
                    </div>
                    <ProgressBar value={rankPct} max={100} size="sm" label={`${rankPct}% to ${next.title}`} />
                </div>
            ) : (
                <p className="mb-4 text-xs text-cyan-200/70">
                    {earned}/{achievements.length} unlocked · max rank reached 🎉
                </p>
            )}

            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {achievements.map((a) => (
                    <li
                        key={a.key}
                        className={`rounded-xl border p-3 ${a.earned
                                ? "border-cyan-500/45 bg-cyan-500/10"
                                : "border-cyan-900/45 bg-[#081a2b]/60"
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span aria-hidden>{a.earned ? "🏅" : "🔒"}</span>
                            <p className={`text-sm font-semibold ${a.earned ? "text-cyan-100" : "text-cyan-100/60"}`}>
                                {a.label}
                            </p>
                        </div>
                        <p className="text-xs text-cyan-200/70">{a.description}</p>
                        {!a.earned && (
                            <p className="mt-1 text-[11px] text-cyan-300/70">
                                {a.current}/{a.target}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
