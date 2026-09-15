import { createClient } from "./supabase/server";
import {
    isUuid,
    PROGRESS_STATUSES,
    NOTE_MAX_LENGTH,
    type ProgressStatus,
    validateNoteInput,
} from "./validation";
import { syncAchievements } from "./achievementState";
import { revalidatePath } from "next/cache";
import { trackServer } from "./analytics";
export class TrackingInputError extends Error {}
function trackingFailure(error: { code?: string; message: string }): never {
    if (["P0001", "23514", "22003", "22P02"].includes(error.code ?? ""))
        throw new TrackingInputError(error.message);
    throw new Error("Could not save tracking. Please try again.");
}
export async function saveTracking(input: {
    seriesId: string;
    episode: number;
    status?: ProgressStatus;
    note?: string;
    noteEpisode?: number;
    addOnly?: boolean;
}) {
    if (
        !isUuid(input.seriesId) ||
        !Number.isInteger(input.episode) ||
        input.episode < 0
    )
        throw new Error("Invalid title or episode.");
    if (input.status !== undefined && !PROGRESS_STATUSES.includes(input.status))
        throw new Error("Invalid status.");
    if (
        input.note !== undefined &&
        (typeof input.note !== "string" || input.note.length > NOTE_MAX_LENGTH)
    )
        throw new Error("Invalid note.");
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data, error } = await client.rpc("save_tracking", {
        p_series_id: input.seriesId,
        p_episode: input.episode,
        p_status: input.status ?? null,
        p_note: input.note ?? null,
        p_note_episode: input.noteEpisode ?? null,
        p_add_only: input.addOnly ?? false,
    });
    if (error) trackingFailure(error);
    await syncAchievements();
    await trackServer(input.addOnly ? "add_to_tracker" : "log_episode", {
        seriesId: input.seriesId,
        episode: data.current_episode,
    });
    for (const path of [
        "/",
        "/series",
        "/rankings",
        "/achievements",
        `/series/${input.seriesId}`,
    ])
        revalidatePath(path);
    return data as {
        current_episode: number;
        status: ProgressStatus;
        movie_note: string | null;
    };
}

/** Note-only API writes share the same database trigger validation as check-ins. */
export async function saveEpisodeNote(
    seriesId: string,
    episodeNumber: number,
    note: string,
) {
    const input = validateNoteInput({ seriesId, episodeNumber, note });
    if (!input.ok) throw new Error(input.error);
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data, error } = await client
        .from("episode_notes")
        .upsert(
            {
                user_id: user.id,
                series_id: seriesId,
                episode_number: episodeNumber,
                note,
            },
            { onConflict: "user_id,series_id,episode_number" },
        )
        .select()
        .single();
    if (error) trackingFailure(error);
    revalidatePath(`/series/${seriesId}`);
    return data;
}
