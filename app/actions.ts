"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSnapshotFor, generateShareSlug } from "@/lib/share";
import type { ProgressStatus } from "@/lib/validation";
import { saveTracking, saveEpisodeNote } from "@/lib/tracking";
import { getProfile } from "@/lib/profiles";

export async function setEpisodeProgress(seriesId: string, episode: number) {
    const data = await saveTracking({ seriesId, episode });
    return { currentEpisode: data.current_episode };
}
export async function addSeriesToTracker(seriesId: string) {
    await saveTracking({
        seriesId,
        episode: 0,
        status: "plan_to_watch",
        addOnly: true,
    });
}
export async function setSeriesStatus(
    seriesId: string,
    currentEpisode: number,
    status: ProgressStatus,
) {
    await saveTracking({ seriesId, episode: currentEpisode, status });
}
export async function saveEpisodeCheckIn(
    seriesId: string,
    episodeNumber: number,
    status: ProgressStatus,
    note: string,
) {
    if (!Number.isInteger(episodeNumber) || episodeNumber < 1)
        throw new Error("Invalid episode number");
    await saveTracking({
        seriesId,
        episode: episodeNumber,
        status,
        note,
        noteEpisode: episodeNumber,
    });
}
/** Flip a movie between watched and plan-to-watch without touching its note. */
export async function setMovieWatched(seriesId: string, watched: boolean) {
    await saveTracking({
        seriesId,
        episode: watched ? 1 : 0,
        status: watched ? "completed" : "plan_to_watch",
    });
}
export async function saveMovieProgress(
    seriesId: string,
    watched: boolean,
    note: string,
) {
    await saveTracking({
        seriesId,
        episode: watched ? 1 : 0,
        status: watched ? "completed" : "plan_to_watch",
        note,
    });
}

/**
 * Create (or reuse) a public share card for one of the signed-in user's earned
 * achievements — or their overall stats ("stats"). Re-derives the snapshot
 * server-side so a user can't mint a card for something they haven't earned.
 * Returns the opaque slug for the public /share/[slug] URL.
 */
export async function createShareCard(
    shareKey: string,
): Promise<{ slug: string }> {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const snapshot = await buildSnapshotFor(shareKey);
    if (!snapshot) throw new Error("Nothing to share for this yet");

    // Reuse an existing card for the same moment so repeat shares are stable.
    const { data: existing } = await client
        .from("share_cards")
        .select("slug")
        .eq("user_id", user.id)
        .eq("share_key", shareKey)
        .maybeSingle();
    if (existing?.slug) return { slug: existing.slug };

    const displayName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        "A TokuDex fan";
    const slug = generateShareSlug();

    const { error } = await client.from("share_cards").insert({
        slug,
        user_id: user.id,
        share_key: shareKey,
        kind: snapshot.kind,
        title: snapshot.title,
        subtitle: snapshot.subtitle,
        stat_label: snapshot.statLabel,
        stat_value: snapshot.statValue,
        display_name: displayName,
    });
    if (error) throw new Error(error.message);

    return { slug };
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

/** Episodes logged across tokusatsu series — the number ranks are keyed off. */
export async function getRankProgress(): Promise<{ logged: number } | null> {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) return null;
    const { data } = await client
        .from("user_series_progress")
        .select("current_episode, series(category, format)")
        .eq("user_id", user.id);
    const logged = (
        (data ?? []) as unknown as {
            current_episode: number | null;
            series: { category: string; format: string } | null;
        }[]
    ).reduce(
        (n, r) =>
            r.series?.category === "tokusatsu" && r.series.format === "series"
                ? n + (r.current_episode ?? 0)
                : n,
        0,
    );
    return { logged };
}

/** Save or replace the private note on one logged episode without touching progress. */
export async function saveNote(seriesId: string, episode: number, note: string) {
    if (!Number.isInteger(episode) || episode < 1)
        throw new Error("Invalid episode number");
    await saveEpisodeNote(seriesId, episode, note);
}

/** Weekly recap preference. Nothing is emailed yet; the choice is kept for when it is. */
export async function setWeeklyRecap(enabled: boolean) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { error } = await client.from("notification_prefs").upsert(
        { user_id: user.id, weekly_recap: enabled, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
    );
    if (error) throw new Error("Could not save that preference.");
}

/** Public handle and whether your logging shows in the community feed. */
export async function saveProfile(input: {
    handle: string;
    shareActivity: boolean;
}) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { error } = await client.rpc("set_profile", {
        p_handle: input.handle.trim().toLowerCase(),
        p_display: null,
        p_share_activity: input.shareActivity,
    });
    if (error) throw new Error(error.message);
}

/** Just the community-feed switch; keeps the member's current handle. */
export async function saveShareActivity(shareActivity: boolean) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const profile = await getProfile(user.id);
    if (!profile) throw new Error("Set a handle first.");
    const { error } = await client.rpc("set_profile", {
        p_handle: profile.handle,
        p_display: null,
        p_share_activity: shareActivity,
    });
    if (error) throw new Error(error.message);
}
