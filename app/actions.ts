"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ProgressStatus = "watching" | "completed" | "on_hold" | "plan_to_watch";

function statusForProgress(currentEpisode: number, totalEpisodes: number | null): ProgressStatus {
    if (currentEpisode <= 0) return "plan_to_watch";
    if (totalEpisodes && currentEpisode >= totalEpisodes) return "completed";
    return "watching";
}

/**
 * Mark a series watched up to (and including) `episode`. Passing 0 resets the
 * series to "not started". Persists to user_series_progress and refreshes the
 * pages that render progress.
 */
export async function setEpisodeProgress(seriesId: string, episode: number) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Clamp against the series' real episode count.
    const { data: series } = await client
        .from("series")
        .select("total_episodes")
        .eq("id", seriesId)
        .single();

    const total = series?.total_episodes ?? null;
    const current = Math.max(0, total ? Math.min(episode, total) : episode);

    const { error } = await client.from("user_series_progress").upsert(
        {
            user_id: user.id,
            series_id: seriesId,
            current_episode: current,
            status: statusForProgress(current, total),
            last_watched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,series_id" }
    );

    if (error) throw new Error(error.message);

    revalidatePath(`/series/${seriesId}`);
    revalidatePath("/series");
    revalidatePath("/");

    return { currentEpisode: current };
}

/**
 * Add a series to the signed-in user's tracker without starting it. No-op if
 * the user already tracks the series.
 */
export async function addSeriesToTracker(seriesId: string) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await client.from("user_series_progress").upsert(
        {
            user_id: user.id,
            series_id: seriesId,
            current_episode: 0,
            status: "plan_to_watch",
            last_watched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,series_id", ignoreDuplicates: true }
    );

    if (error) throw new Error(error.message);

    revalidatePath(`/series/${seriesId}`);
    revalidatePath("/series");
    revalidatePath("/");
}
