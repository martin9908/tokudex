/**
 * Display helpers for user_series_progress.status. The stored values are
 * unchanged; only the words people see are the redesign's: Watching, Done,
 * Shelved, Someday.
 */

export const STATUS_LABELS: Record<string, string> = {
    watching: "Watching",
    completed: "Done",
    on_hold: "Shelved",
    plan_to_watch: "Someday",
};

export function statusLabel(status?: string | null): string {
    return (status && STATUS_LABELS[status]) || "Someday";
}
