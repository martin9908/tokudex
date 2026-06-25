import { createClient as createServerClient } from "./server";
import { createClient as createBrowserClient } from "./client";

/**
 * Series queries
 */

export async function getAllSeries() {
    const client = await createServerClient();
    const { data, error } = await client
        .from("series")
        .select("*")
        .order("title", { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getSeriesById(id: string) {
    const client = await createServerClient();
    const { data, error } = await client.from("series").select("*").eq("id", id).single();

    if (error) throw error;
    return data;
}

export async function getSeriesWithEpisodes(id: string) {
    const client = await createServerClient();
    const { data: series, error: seriesError } = await client
        .from("series")
        .select("*")
        .eq("id", id)
        .single();

    if (seriesError) throw seriesError;

    const { data: episodes, error: episodesError } = await client
        .from("episodes")
        .select("*")
        .eq("series_id", id)
        .order("episode_number", { ascending: true });

    if (episodesError) throw episodesError;

    return { ...series, episodes: episodes || [] };
}

/**
 * User progress queries
 */

export async function getUserProgress(userId: string, seriesId: string) {
    const client = await createServerClient();
    const { data, error } = await client
        .from("user_series_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("series_id", seriesId)
        .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data || null;
}

export async function getUserProgressBySeries(userId: string) {
    const client = await createServerClient();
    const { data, error } = await client
        .from("user_series_progress")
        .select("*, series(*)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function upsertUserProgress(
    userId: string,
    seriesId: string,
    currentEpisode: number,
    status: "watching" | "completed" | "on_hold" | "plan_to_watch"
) {
    const client = await createServerClient();
    const { data, error } = await client
        .from("user_series_progress")
        .upsert(
            {
                user_id: userId,
                series_id: seriesId,
                current_episode: currentEpisode,
                status: status,
                last_watched_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,series_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Episode notes queries
 */

export async function getEpisodeNote(userId: string, seriesId: string, episodeNumber: number) {
    const client = await createServerClient();
    const { data, error } = await client
        .from("episode_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("series_id", seriesId)
        .eq("episode_number", episodeNumber)
        .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
}

export async function getSeriesEpisodeNotes(userId: string, seriesId: string) {
    const client = await createServerClient();
    const { data, error } = await client
        .from("episode_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("series_id", seriesId)
        .order("episode_number", { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function upsertEpisodeNote(
    userId: string,
    seriesId: string,
    episodeNumber: number,
    note: string
) {
    const client = await createServerClient();
    const { data, error } = await client
        .from("episode_notes")
        .upsert(
            {
                user_id: userId,
                series_id: seriesId,
                episode_number: episodeNumber,
                note: note,
                created_at: new Date().toISOString(),
            },
            { onConflict: "user_id,series_id,episode_number" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Browser-side mutations (for client components that need immediate feedback)
 */

export async function browserUpsertUserProgress(
    userId: string,
    seriesId: string,
    currentEpisode: number,
    status: "watching" | "completed" | "on_hold" | "plan_to_watch"
) {
    const client = createBrowserClient();
    const { data, error } = await client
        .from("user_series_progress")
        .upsert(
            {
                user_id: userId,
                series_id: seriesId,
                current_episode: currentEpisode,
                status: status,
                last_watched_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,series_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function browserUpsertEpisodeNote(
    userId: string,
    seriesId: string,
    episodeNumber: number,
    note: string
) {
    const client = createBrowserClient();
    const { data, error } = await client
        .from("episode_notes")
        .upsert(
            {
                user_id: userId,
                series_id: seriesId,
                episode_number: episodeNumber,
                note: note,
                created_at: new Date().toISOString(),
            },
            { onConflict: "user_id,series_id,episode_number" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}
