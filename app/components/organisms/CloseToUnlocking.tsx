import Link from "next/link";
import type { AchievementsView } from "@/lib/achievementState";
import { BigNumber, Bar } from "../atoms";

type Candidate = {
    key: string;
    name: string;
    description: string;
    current: number;
    target: number;
};

/** The unearned milestones and collections nearest to done, closest first. */
export function closestToUnlocking(view: AchievementsView, limit = 3): Candidate[] {
    return [
        ...view.milestones.map((m) => ({ ...m, name: m.label })),
        ...view.collections.map((c) => ({ ...c, name: c.title })),
    ]
        .filter((a) => !a.earned && a.current > 0)
        .sort((a, b) => b.current / b.target - a.current / a.target)
        .slice(0, limit)
        .map(({ key, name, description, current, target }) => ({
            key,
            name,
            description,
            current,
            target,
        }));
}

export default function CloseToUnlocking({ view }: { view: AchievementsView }) {
    const rows = closestToUnlocking(view);
    const { rankCurrent, rankNext, episodesLogged } = view;
    return (
        <section className="px-[18px] py-[22px] md:p-[30px]">
            <div className="flex items-baseline gap-2.5">
                <h2 className="text-[15px] font-medium">Close to unlocking</h2>
                <Link
                    href="/achievements"
                    className="tdx-focus-ring rounded-sm ml-auto text-[12px] whitespace-nowrap"
                >
                    All awards{" "}
                    <span className="text-[var(--accent-primary)]">→</span>
                </Link>
            </div>
            <p className="text-[11.5px] text-[var(--text-secondary)] mt-[9px]">
                {rankCurrent.title}
                {rankNext
                    ? ` · ${(rankNext.min - episodesLogged).toLocaleString()} episodes to ${rankNext.title}`
                    : " · top rank"}
            </p>
            {rows.length === 0 ? (
                <p className="text-[12px] text-[var(--text-muted)] mt-5">
                    Log a few episodes and the nearest awards show up here.
                </p>
            ) : (
                <div className="flex flex-col gap-[20px] mt-[20px]">
                    {rows.map((a) => (
                        <div key={a.key}>
                            <div className="flex items-end gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] truncate">
                                        {a.name}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-secondary)] mt-[3px] truncate">
                                        {a.description}
                                    </p>
                                </div>
                                <p className="whitespace-nowrap">
                                    <BigNumber size={19}>
                                        {a.current.toLocaleString()}
                                    </BigNumber>
                                    <span className="text-[11px] text-[var(--text-muted)] ml-1">
                                        / {a.target.toLocaleString()}
                                    </span>
                                </p>
                            </div>
                            <Bar
                                value={a.current}
                                max={a.target}
                                label={`${a.name} progress`}
                                className="mt-[9px] max-w-[82%]"
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
