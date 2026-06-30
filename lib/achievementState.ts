import { createClient } from "./supabase/server";
import {
    getRank,
    getAchievements,
    type Rank,
    type Achievement,
} from "./achievements";
import {
    evaluateCollections,
    type CompletedSeries,
    type CollectionAchievement,
} from "./franchiseAchievements";
import { getEarnedSeriesBadges, SERIES_BADGES } from "./seriesBadges";

type ProgressRow = {
    current_episode: number | null;
    status: string | null;
    series: { title: string; franchise: string | null } | null;
};

type ProgressTotals = {
    seriesTracked: number;
    episodesLogged: number;
    seriesCompleted: number;
    completed: CompletedSeries[];
};

// Loads + reduces the signed-in user's progress. Returns null when logged out.
async function loadProgress(): Promise<{ userId: string; totals: ProgressTotals } | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from("user_series_progress")
        .select("current_episode, status, series(title, franchise)")
        .eq("user_id", user.id);

    const rows = (data ?? []) as unknown as ProgressRow[];
    const completedRows = rows.filter((r) => r.status === "completed" && r.series);

    return {
        userId: user.id,
        totals: {
            seriesTracked: rows.length,
            episodesLogged: rows.reduce((sum, r) => sum + (r.current_episode || 0), 0),
            seriesCompleted: completedRows.length,
            completed: completedRows.map((r) => ({
                title: r.series!.title,
                franchise: r.series!.franchise,
            })),
        },
    };
}

// Stable earned keys (+ labels) for everything currently earned. Used by the
// global toaster and by syncAchievements.
function deriveEarned(totals: ProgressTotals): { earned: string[]; labels: Record<string, string> } {
    const { seriesTracked, episodesLogged, seriesCompleted, completed } = totals;
    const earned: string[] = [];
    const labels: Record<string, string> = {};

    const { current } = getRank(episodesLogged);
    const rankKey = `rank-${current.title}`;
    earned.push(rankKey);
    labels[rankKey] = `New rank: ${current.title}`;

    for (const a of getAchievements({ seriesTracked, episodesLogged, seriesCompleted })) {
        if (a.earned) {
            earned.push(`ach-${a.key}`);
            labels[`ach-${a.key}`] = a.label;
        }
    }
    for (const c of evaluateCollections(completed)) {
        if (c.earned) {
            earned.push(`col-${c.key}`);
            labels[`col-${c.key}`] = c.title;
        }
    }
    for (const b of getEarnedSeriesBadges(completed.map((c) => c.title))) {
        earned.push(`series-${b.key}`);
        labels[`series-${b.key}`] = b.name;
    }
    return { earned, labels };
}

export type EarnedState = { earned: string[]; labels: Record<string, string> };

export async function getEarnedAchievements(): Promise<EarnedState | null> {
    const loaded = await loadProgress();
    if (!loaded) return null;
    return deriveEarned(loaded.totals);
}

/**
 * Persist newly-earned achievements to user_achievements. Idempotent — existing
 * rows keep their original earned_at. Call after a progress mutation.
 */
export async function syncAchievements(): Promise<void> {
    const loaded = await loadProgress();
    if (!loaded) return;
    const { earned } = deriveEarned(loaded.totals);
    if (earned.length === 0) return;

    const supabase = await createClient();
    const rows = earned.map((key) => ({ user_id: loaded.userId, achievement_key: key }));
    await supabase
        .from("user_achievements")
        .upsert(rows, { onConflict: "user_id,achievement_key", ignoreDuplicates: true });
}

export type AchievementsView = {
    episodesLogged: number;
    rankCurrent: Rank;
    rankNext: Rank | null;
    milestones: Achievement[];
    collections: CollectionAchievement[];
    seriesBadges: { key: string; name: string; earned: boolean }[];
    earnedAt: Record<string, string>; // earned key -> ISO timestamp
    earnedCount: number;
    totalCount: number;
};

export async function getAchievementsView(): Promise<AchievementsView | null> {
    const loaded = await loadProgress();
    if (!loaded) return null;
    const { seriesTracked, episodesLogged, seriesCompleted, completed } = loaded.totals;

    const { current, next } = getRank(episodesLogged);
    const milestones = getAchievements({ seriesTracked, episodesLogged, seriesCompleted });
    const collections = evaluateCollections(completed);

    const earnedBadgeKeys = new Set(
        getEarnedSeriesBadges(completed.map((c) => c.title)).map((b) => b.key)
    );
    const seriesBadges = SERIES_BADGES.map((b) => ({
        key: `series-${b.key}`,
        name: b.name,
        earned: earnedBadgeKeys.has(b.key),
    }));

    // Earned-at timestamps from the backend (best-effort; table may not exist yet).
    const earnedAt: Record<string, string> = {};
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("user_achievements")
            .select("achievement_key, earned_at")
            .eq("user_id", loaded.userId);
        for (const row of data ?? []) {
            earnedAt[(row as { achievement_key: string }).achievement_key] = (
                row as { earned_at: string }
            ).earned_at;
        }
    } catch {
        // table not migrated yet — page still works from computed state.
    }

    const earnedCount =
        milestones.filter((m) => m.earned).length +
        collections.filter((c) => c.earned).length +
        seriesBadges.filter((b) => b.earned).length;
    const totalCount = milestones.length + collections.length + seriesBadges.length;

    return {
        episodesLogged,
        rankCurrent: current,
        rankNext: next,
        milestones,
        collections,
        seriesBadges,
        earnedAt,
        earnedCount,
        totalCount,
    };
}
