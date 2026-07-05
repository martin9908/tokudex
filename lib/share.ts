import { randomUUID } from "crypto";
import { createClient } from "./supabase/server";
import { getAchievementsView, getEarnedAchievements } from "./achievementState";

export type ShareKind = "rank" | "milestone" | "trophy" | "series" | "stats";

export type ShareSnapshot = {
    shareKey: string;
    kind: ShareKind;
    title: string;
    subtitle: string;
    statLabel: string;
    statValue: string;
};

export type ShareCard = {
    slug: string;
    kind: string;
    title: string;
    subtitle: string | null;
    stat_label: string | null;
    stat_value: string | null;
    display_name: string | null;
};

// Special key for the overall "my stats" card (not tied to one achievement).
export const STATS_SHARE_KEY = "stats";

/** Emoji used on the share card / OG image for a given kind. */
export function shareEmoji(kind: string): string {
    switch (kind) {
        case "trophy":
            return "🏆";
        case "rank":
            return "🎖️";
        case "stats":
            return "📊";
        default:
            return "🏅";
    }
}

function classify(shareKey: string): { kind: ShareKind; subtitle: string } {
    if (shareKey.startsWith("rank-")) return { kind: "rank", subtitle: "Rank reached on TokuDex" };
    if (shareKey.startsWith("col-")) return { kind: "trophy", subtitle: "Franchise trophy earned" };
    if (shareKey.startsWith("series-")) return { kind: "series", subtitle: "Series completed" };
    return { kind: "milestone", subtitle: "Achievement unlocked" };
}

/**
 * Builds a shareable snapshot for the signed-in user from their live achievement
 * state. Re-derives everything server-side (never trusts the client) and returns
 * null if the key isn't actually earned. Reuses the same reducers the
 * achievements page uses so labels stay identical.
 */
export async function buildSnapshotFor(shareKey: string): Promise<ShareSnapshot | null> {
    const [view, earnedState] = await Promise.all([
        getAchievementsView(),
        getEarnedAchievements(),
    ]);
    if (!view || !earnedState) return null;

    const statValue = String(view.episodesLogged);

    if (shareKey === STATS_SHARE_KEY) {
        return {
            shareKey,
            kind: "stats",
            title: view.rankCurrent.title,
            subtitle: "My tokusatsu progress",
            statLabel: "Episodes logged",
            statValue,
        };
    }

    // Guard: only allow sharing something the user has actually earned.
    if (!earnedState.earned.includes(shareKey)) return null;

    const { kind, subtitle } = classify(shareKey);
    const title = kind === "rank" ? view.rankCurrent.title : earnedState.labels[shareKey] ?? shareKey;

    return { shareKey, kind, title, subtitle, statLabel: "Episodes logged", statValue };
}

/** Opaque, non-guessable slug for a public share URL. */
export function generateShareSlug(): string {
    return randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Public read of a share card by slug (anon-safe; RLS allows select). */
export async function getShareCard(slug: string): Promise<ShareCard | null> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("share_cards")
        .select("slug, kind, title, subtitle, stat_label, stat_value, display_name")
        .eq("slug", slug)
        .maybeSingle();
    return (data as ShareCard | null) ?? null;
}
