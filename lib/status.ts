/**
 * Display helpers for user_series_progress.status — a shared label + color
 * mapping so tracking status reads consistently (and legibly) across the app.
 */

export const STATUS_LABELS: Record<string, string> = {
    watching: "Watching",
    completed: "Completed",
    on_hold: "On Hold",
    plan_to_watch: "Plan to Watch",
};

// Per-status accent classes (border + tint + text) for badges/pills.
export const STATUS_BADGE_CLASSES: Record<string, string> = {
    watching: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
    completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
    on_hold: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    plan_to_watch: "border-slate-500/40 bg-slate-500/15 text-slate-200",
};

// Just the text color, for coloring numbers/labels without a full pill.
export const STATUS_TEXT_CLASSES: Record<string, string> = {
    watching: "text-cyan-300",
    completed: "text-emerald-300",
    on_hold: "text-amber-300",
    plan_to_watch: "text-slate-300",
};

export function statusLabel(status?: string | null): string {
    return (status && STATUS_LABELS[status]) || "Plan to Watch";
}

export function statusBadgeClass(status?: string | null): string {
    return (status && STATUS_BADGE_CLASSES[status]) || STATUS_BADGE_CLASSES.plan_to_watch;
}
