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
        total_episodes: number | null;
        cover_image_url: string | null;
        copyright_notice: string | null;
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
        .filter((row): row is ProgressRow & { series: WatchItem["series"] } => !!row.series)
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
                total_episodes: row.series.total_episodes,
                cover_image_url: row.series.cover_image_url,
                copyright_notice: row.series.copyright_notice,
            },
        }));
}

/** Count tracked series by status. */
export function summarizeProgress(rows: { status: string }[]): ProgressStats {
    const stats: ProgressStats = { watching: 0, completed: 0, on_hold: 0, plan_to_watch: 0 };
    for (const row of rows) {
        if (row.status in stats) stats[row.status as keyof ProgressStats]++;
    }
    return stats;
}

/** Percentage watched, clamped to 0–100. */
export function watchedPercent(current: number | null, total: number | null): number {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round(((current || 0) / total) * 100));
}
