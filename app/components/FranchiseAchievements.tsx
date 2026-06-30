import { evaluateCollections, type CompletedSeries } from "@/lib/franchiseAchievements";
import { badgeForSeries } from "@/lib/seriesBadges";

export default function FranchiseAchievements({
    completed,
}: {
    completed: CompletedSeries[];
}) {
    const collections = evaluateCollections(completed);
    const earned = collections.filter((c) => c.earned).length;

    const seriesChips = completed.map((c) => {
        const badge = badgeForSeries(c.title);
        return badge ? { label: badge.name, themed: true } : { label: c.title, themed: false };
    });

    return (
        <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl p-4 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-2xl font-semibold">Franchise Trophies</h2>
                <span className="text-xs text-cyan-200/70">
                    {earned}/{collections.length} earned
                </span>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {collections.map((c) => (
                    <li
                        key={c.key}
                        className={`rounded-xl border p-3 ${
                            c.earned
                                ? "border-amber-400/45 bg-amber-400/10"
                                : "border-cyan-900/45 bg-[#081a2b]/60"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span aria-hidden>{c.earned ? "🏆" : "🔒"}</span>
                            <p
                                className={`text-sm font-semibold ${
                                    c.earned ? "text-amber-100" : "text-cyan-100/65"
                                }`}
                            >
                                {c.title}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-cyan-200/70">{c.description}</p>
                        {!c.earned && c.target > 1 && (
                            <div className="mt-2">
                                <div
                                    role="progressbar"
                                    aria-valuenow={c.current}
                                    aria-valuemin={0}
                                    aria-valuemax={c.target}
                                    aria-label={`${c.current} of ${c.target}`}
                                    className="h-1 w-full rounded-full bg-cyan-950/80 overflow-hidden"
                                >
                                    <div
                                        className="h-full bg-cyan-400"
                                        style={{ width: `${Math.round((c.current / c.target) * 100)}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-[11px] text-cyan-300/70">
                                    {c.current}/{c.target}
                                </p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {seriesChips.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider text-cyan-200/70 mb-2">
                        Series badges
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {seriesChips.map((chip, i) => (
                            <span
                                key={i}
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                    chip.themed
                                        ? "border-amber-400/45 bg-amber-400/10 text-amber-100"
                                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                }`}
                            >
                                {chip.themed ? `🏅 ${chip.label}` : `✓ ${chip.label}`}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
