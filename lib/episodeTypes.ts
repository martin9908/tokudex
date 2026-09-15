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

// Flat, neutral hairline pill — every episode-type tag reads the same way,
// so the tag communicates "this isn't a normal episode" without competing
// with the accent color used for watch-progress state.
const NEUTRAL_BADGE = "border-[var(--line)] text-[var(--text-muted)]";
export const EPISODE_TYPE_BADGE_CLASSES: Record<EpisodeType, string> = {
    filler: NEUTRAL_BADGE,
    clip_show: NEUTRAL_BADGE,
    recap: NEUTRAL_BADGE,
    special: NEUTRAL_BADGE,
    crossover: NEUTRAL_BADGE,
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
