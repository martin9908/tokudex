import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/series/[id] - Get series with episodes and user progress
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const client = await createClient();

        // Get authenticated user
        const {
            data: { user },
        } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get series
        const { data: series, error: seriesError } = await client
            .from("series")
            .select("*")
            .eq("id", id)
            .single();

        if (seriesError) {
            if (seriesError.code === "PGRST116") {
                return NextResponse.json({ error: "Series not found" }, { status: 404 });
            }
            throw seriesError;
        }

        // Get episodes
        const { data: episodes, error: episodesError } = await client
            .from("episodes")
            .select("*")
            .eq("series_id", id)
            .order("episode_number", { ascending: true });

        if (episodesError) throw episodesError;

        // Get user progress
        const { data: progress, error: progressError } = await client
            .from("user_series_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("series_id", id)
            .single();

        if (progressError && progressError.code !== "PGRST116") throw progressError;

        // Get episode notes
        const { data: notes, error: notesError } = await client
            .from("episode_notes")
            .select("*")
            .eq("user_id", user.id)
            .eq("series_id", id);

        if (notesError) throw notesError;

        return NextResponse.json({
            series,
            episodes: episodes || [],
            progress: progress || null,
            notes: notes || [],
        });
    } catch (error) {
        console.error("Error fetching series:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
