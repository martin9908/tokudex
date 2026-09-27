/**
 * Shaping helpers for user_series_progress rows joined with series(*).
 * Keeps the home page (and any future consumer) free of inline mapping and
 * status-counting logic.
 */

export type WatchItem = {
    progress: {
        id: string;
        current_episode: number;
        status: string;
        last_watched_at: string;
    };
    series: {
        id: string;
        title: string;
        franchise: string | null;
        category: string;
        format: string;
        hidden: boolean;
        total_episodes: number | null;
        cover_image_url: string | null;
        copyright_notice: string | null;
        release_year: number | null;
        runtime_minutes: number | null;
    };
};

export type ProgressStats = {
    watching: number;
    completed: number;
    on_hold: number;
    plan_to_watch: number;
};

// The joined shape returned by getUserProgressBySeries (progress row + series(*)).
type ProgressRow = {
    id: string;
    current_episode: number;
    status: string;
    last_watched_at: string;
    series: WatchItem["series"] | null;
};

/** Map raw progress+series rows into typed WatchItems, dropping orphaned rows. */
export function toWatchItems(rows: ProgressRow[]): WatchItem[] {
    return rows
        .filter(
            (row): row is ProgressRow & { series: WatchItem["series"] } =>
                !!row.series,
        )
        .map((row) => ({
            progress: {
                id: row.id,
                current_episode: row.current_episode,
                status: row.status,
                last_watched_at: row.last_watched_at,
            },
            series: {
                id: row.series.id,
                title: row.series.title,
                franchise: row.series.franchise,
                category: row.series.category,
                format: row.series.format,
                hidden: row.series.hidden,
                total_episodes: row.series.total_episodes,
                cover_image_url: row.series.cover_image_url,
                copyright_notice: row.series.copyright_notice,
                release_year: row.series.release_year,
                runtime_minutes: row.series.runtime_minutes ?? null,
            },
        }));
}

/** Count tracked series by status. */
export function summarizeProgress(rows: { status: string }[]): ProgressStats {
    const stats: ProgressStats = {
        watching: 0,
        completed: 0,
        on_hold: 0,
        plan_to_watch: 0,
    };
    for (const row of rows) {
        if (row.status in stats) stats[row.status as keyof ProgressStats]++;
    }
    return stats;
}

/** Percentage watched, clamped to 0–100. */
export function watchedPercent(
    current: number | null,
    total: number | null,
): number {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round(((current || 0) / total) * 100));
}

/** "2 days ago" / "3 hours ago" / "just now" — coarse, no dependency. */
export function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? "" : "s"} ago`;
}

const DAY_MS = 86_400_000;

/** "Tue" within the last week, otherwise "14 Apr". */
export function shortWhen(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    const days = (Date.now() - date.getTime()) / DAY_MS;
    if (days < 1) return "today";
    if (days < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** "March" — for "nothing since March" / "last in July". */
export function monthName(iso: string | null | undefined): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(undefined, { month: "long" });
}

/** True when a title has had no activity for 30 days or more. */
export function isQuiet(iso: string | null | undefined): boolean {
    if (!iso) return false;
    return Date.now() - new Date(iso).getTime() >= 30 * DAY_MS;
}

/** ISO timestamp for "n days ago" — kept out of components so the purity lint is happy. */
export function daysAgoIso(days: number): string {
    return new Date(Date.now() - days * DAY_MS).toISOString();
}
