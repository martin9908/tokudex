"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, PROGRESS_STATUSES, NOTE_MAX_LENGTH } from "@/lib/validation";

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
    if (!isUuid(seriesId)) throw new Error("Invalid series id");
    if (!Number.isInteger(episode) || episode < 0) {
        throw new Error("Invalid episode number");
    }

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
    if (!isUuid(seriesId)) throw new Error("Invalid series id");

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

/**
 * Episode check-in: record progress for `episodeNumber` (with an explicit
 * status) and, optionally, save a recap note — in a single server round-trip.
 * Both writes are idempotent upserts, so if one fails the user can simply retry
 * and the partial state heals (no orphaned half-save as with two separate fetches).
 */
export async function saveEpisodeCheckIn(
    seriesId: string,
    episodeNumber: number,
    status: ProgressStatus,
    note: string
) {
    if (!isUuid(seriesId)) throw new Error("Invalid series id");
    if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
        throw new Error("Invalid episode number");
    }
    if (!PROGRESS_STATUSES.includes(status)) throw new Error("Invalid status");

    const trimmedNote = note.trim();
    if (trimmedNote.length > NOTE_MAX_LENGTH) {
        throw new Error(`Note must be ${NOTE_MAX_LENGTH} characters or fewer`);
    }

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
    const current = total ? Math.min(episodeNumber, total) : episodeNumber;

    const now = new Date().toISOString();

    const { error: progressError } = await client.from("user_series_progress").upsert(
        {
            user_id: user.id,
            series_id: seriesId,
            current_episode: current,
            status,
            last_watched_at: now,
            updated_at: now,
        },
        { onConflict: "user_id,series_id" }
    );

    if (progressError) throw new Error(progressError.message);

    if (trimmedNote) {
        const { error: noteError } = await client.from("episode_notes").upsert(
            {
                user_id: user.id,
                series_id: seriesId,
                episode_number: episodeNumber,
                note: trimmedNote,
                created_at: now,
            },
            { onConflict: "user_id,series_id,episode_number" }
        );

        if (noteError) throw new Error(noteError.message);
    }

    revalidatePath(`/series/${seriesId}`);
    revalidatePath("/series");
    revalidatePath("/");
}

/**
 * Permanently delete the signed-in user's account. Removing the auth.users row
 * cascades to user_series_progress and episode_notes (FK on delete cascade), so
 * all of the user's data is erased. Requires the service-role key.
 *
 * The caller should sign out client-side afterwards (the session is now invalid).
 */
export async function deleteAccount() {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(error.message);
}
