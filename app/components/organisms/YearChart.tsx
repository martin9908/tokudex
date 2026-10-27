import Link from "next/link";
import { monthLabel, type YearSummary } from "@/lib/yearActivity";

/**
 * "Your <year>": episodes logged per month. Bars are neutral; the busiest and
 * current months carry the accent and a value label. Every month is a
 * focusable hover target with its own tooltip, so values never depend on the
 * two labelled bars.
 */
export default function YearChart({ summary }: { summary: YearSummary }) {
    const { year, total, months, busiest, quiet, top } = summary;
    const max = Math.max(1, ...months.map((m) => m.episodes));
    const thisMonth = months.find((m) => m.current)?.month ?? 11;
    // History is only kept from when activity tracking shipped; say so rather
    // than let earlier months read as "watched nothing".
    const firstTracked = months.find((m) => m.tracked)?.month;
    const notes = [
        busiest &&
            `Busiest in ${monthLabel(busiest.month)}${busiest.mostly ? `, mostly ${busiest.mostly}` : ""}`,
        quiet && `Quiet ${monthLabel(quiet.month)}`,
        top && `${top.title} is ${top.share}% of this year`,
    ].filter(Boolean) as string[];

    return (
        <section className="px-[18px] py-[22px] md:p-[30px]">
            <div className="flex items-baseline gap-2.5">
                <h2 className="text-[15px] font-medium">Your {year}</h2>
                <p className="text-[11.5px] text-[var(--text-secondary)]">
                    {total === 0
                        ? "nothing logged yet"
                        : `${total.toLocaleString()} episode${total === 1 ? "" : "s"} so far`}
                </p>
                <Link
                    href="/achievements"
                    className="tdx-focus-ring rounded-sm ml-auto text-[12px] whitespace-nowrap"
                >
                    All years{" "}
                    <span className="text-[var(--accent-primary)]">→</span>
                </Link>
            </div>

            <ol
                aria-label={`Episodes logged per month in ${year}`}
                className="grid grid-cols-12 gap-[6px] mt-[22px]"
            >
                {months.map((m) => {
                    const lit =
                        m.episodes > 0 &&
                        (m.current || m.month === busiest?.month);
                    const name = monthLabel(m.month);
                    const value = m.tracked
                        ? `${m.episodes} episode${m.episodes === 1 ? "" : "s"}`
                        : m.month > thisMonth
                          ? "still to come"
                          : "not tracked yet";
                    return (
                        <li
                            key={m.month}
                            tabIndex={0}
                            aria-label={`${name}: ${value}`}
                            className="tdx-focus-ring group relative flex flex-col items-center rounded-sm outline-none"
                        >
                            <div className="h-[92px] w-full flex flex-col justify-end items-center">
                                {lit && (
                                    <span
                                        aria-hidden
                                        className="text-[11px] tabular-nums text-[var(--text-primary)] mb-[5px]"
                                    >
                                        {m.episodes}
                                    </span>
                                )}
                                {m.episodes > 0 && (
                                    <div
                                        aria-hidden
                                        className={`w-full rounded-t-[4px] transition-[filter] group-hover:brightness-125 group-focus-visible:brightness-125 ${
                                            lit
                                                ? "bg-[var(--accent-primary)]"
                                                : "bg-[var(--line)]"
                                        }`}
                                        style={{
                                            height: `${Math.max(4, (m.episodes / max) * 72)}px`,
                                        }}
                                    />
                                )}
                            </div>
                            <span
                                aria-hidden
                                className={`text-[10.5px] mt-[7px] ${
                                    m.tracked
                                        ? "text-[var(--text-secondary)]"
                                        : "text-[var(--text-muted)]"
                                }`}
                            >
                                {name[0]}
                            </span>
                            <span
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block group-focus-visible:block whitespace-nowrap rounded-[5px] border border-[var(--line)] bg-[var(--surface-elevated)] px-2 py-1 text-[11px] text-[var(--text-primary)] z-10"
                            >
                                {name} · {value}
                            </span>
                        </li>
                    );
                })}
            </ol>

            {firstTracked !== undefined && firstTracked > 0 && (
                <p className="mt-[14px] text-[11px] text-[var(--text-muted)]">
                    Month-by-month history starts in {monthLabel(firstTracked)}.
                    Earlier logs still count in your totals.
                </p>
            )}

            {notes.length > 0 && (
                <div className="flex flex-wrap gap-x-[26px] gap-y-1.5 mt-[18px] text-[11.5px] text-[var(--text-secondary)]">
                    {notes.map((n) => (
                        <p key={n}>{n}</p>
                    ))}
                </div>
            )}
        </section>
    );
}
