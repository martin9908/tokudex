/**
 * Display helpers for episodes.episode_type — the "this isn't a normal story
 * episode" tag (clip shows, filler, recaps, specials, crossovers).
 *
 * NULL / unrecognised = a regular canon episode, which carries no badge. Keep
 * EPISODE_TYPES in sync with the CHECK constraint in
 * supabase/migrations/20260804000000_episode_type.sql and with the validator in
 * scripts/import-episodes.mjs.
 */

export const EPISODE_TYPES = ["filler", "clip_show", "recap", "special", "crossover"] as const;

export type EpisodeType = (typeof EPISODE_TYPES)[number];

export const EPISODE_TYPE_LABELS: Record<EpisodeType, string> = {
    filler: "Filler",
    clip_show: "Clip Show",
    recap: "Recap",
    special: "Special",
    crossover: "Crossover",
};

// Per-type accent classes (border + tint + text), matching the pill styling
// used for tracking status in lib/status.ts.
export const EPISODE_TYPE_BADGE_CLASSES: Record<EpisodeType, string> = {
    filler: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    clip_show: "border-violet-500/40 bg-violet-500/15 text-violet-200",
    recap: "border-slate-500/40 bg-slate-500/15 text-slate-200",
    special: "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-200",
    crossover: "border-sky-500/40 bg-sky-500/15 text-sky-200",
};

/**
 * The types the "hide filler" toggle hides — the skippable ones. Specials and
 * crossovers are tagged for context but stay visible: people generally want to
 * watch those, they just want to know what they're in for.
 */
export const SKIPPABLE_EPISODE_TYPES: readonly EpisodeType[] = ["filler", "clip_show", "recap"];

/** Narrows an arbitrary DB/CSV value to a known type, or null. */
export function parseEpisodeType(value?: string | null): EpisodeType | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
    return (EPISODE_TYPES as readonly string[]).includes(normalized)
        ? (normalized as EpisodeType)
        : null;
}

export function episodeTypeLabel(value?: string | null): string | null {
    const type = parseEpisodeType(value);
    return type ? EPISODE_TYPE_LABELS[type] : null;
}

export function episodeTypeBadgeClass(value?: string | null): string | null {
    const type = parseEpisodeType(value);
    return type ? EPISODE_TYPE_BADGE_CLASSES[type] : null;
}

export function isSkippableEpisodeType(value?: string | null): boolean {
    const type = parseEpisodeType(value);
    return type !== null && SKIPPABLE_EPISODE_TYPES.includes(type);
}
