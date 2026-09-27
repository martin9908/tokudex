/**
 * Shapes a member's activity rows into the home page's "Your <year>" chart:
 * episodes per month plus the three one-line notes under it. Pure, so the
 * month math is testable without a database.
 */

export type ActivityRow = {
    kind: string;
    /** Episodes the row covers; null on rows written before the column existed. */
    episodes: number | null;
    created_at: string;
    series: { title: string } | null;
};

export type MonthBar = {
    /** 0–11 */
    month: number;
    episodes: number;
    /** false for future months and months before tracking started. */
    tracked: boolean;
    current: boolean;
};

export type YearSummary = {
    year: number;
    total: number;
    months: MonthBar[];
    busiest: { month: number; episodes: number; mostly: string | null } | null;
    quiet: { month: number } | null;
    top: { title: string; share: number } | null;
};

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function monthLabel(month: number): string {
    return MONTHS[month];
}

/** Episodes a row counts for. Old rows predate `episodes`: a log counted as one. */
export function rowEpisodes(row: Pick<ActivityRow, "kind" | "episodes">): number {
    return row.episodes ?? (row.kind === "logged" ? 1 : 0);
}

function topTitle(counts: Map<string, number>): [string, number] | null {
    let best: [string, number] | null = null;
    for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
    return best;
}

export function summarizeYear(rows: ActivityRow[], now = new Date()): YearSummary {
    const year = now.getFullYear();
    const thisMonth = now.getMonth();
    const perMonth = Array.from({ length: 12 }, () => new Map<string, number>());
    const totals = new Array<number>(12).fill(0);
    const bySeries = new Map<string, number>();
    let firstMonth: number | null = null;

    for (const row of rows) {
        const at = new Date(row.created_at);
        if (at.getFullYear() !== year) continue;
        const m = at.getMonth();
        firstMonth = firstMonth === null ? m : Math.min(firstMonth, m);
        const n = rowEpisodes(row);
        if (n === 0) continue;
        totals[m] += n;
        const title = row.series?.title;
        if (title) {
            perMonth[m].set(title, (perMonth[m].get(title) ?? 0) + n);
            bySeries.set(title, (bySeries.get(title) ?? 0) + n);
        }
    }

    const months = totals.map((episodes, month) => ({
        month,
        episodes,
        tracked: firstMonth !== null && month >= firstMonth && month <= thisMonth,
        current: month === thisMonth,
    }));
    const total = totals.reduce((a, b) => a + b, 0);

    let busiest: YearSummary["busiest"] = null;
    for (const m of months)
        if (m.episodes > 0 && (!busiest || m.episodes > busiest.episodes))
            busiest = { month: m.month, episodes: m.episodes, mostly: null };
    if (busiest) {
        const mostly = topTitle(perMonth[busiest.month]);
        // "mostly X" only when X really dominates the month.
        if (mostly && mostly[1] / busiest.episodes >= 0.5) busiest.mostly = mostly[0];
    }

    // Quietest finished month; the current month is still filling up.
    const finished = months.filter((m) => m.tracked && !m.current);
    let quiet: YearSummary["quiet"] = null;
    if (finished.length >= 2) {
        const low = finished.reduce((a, b) => (b.episodes < a.episodes ? b : a));
        if (low.month !== busiest?.month) quiet = { month: low.month };
    }

    const best = topTitle(bySeries);
    const top =
        best && total > 0 && bySeries.size > 1
            ? { title: best[0], share: Math.round((best[1] / total) * 100) }
            : null;

    return { year, total, months, busiest, quiet, top };
}
