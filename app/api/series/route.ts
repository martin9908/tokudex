import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/series - Get all series
 */
export async function GET() {
    try {
        const client = await createClient();

        // Get authenticated user
        const {
            data: { user },
        } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all series
        const { data: series, error: seriesError } = await client
            .from("series")
            .select("*")
            .order("title", { ascending: true });

        if (seriesError) throw seriesError;

        // Get user progress for all series
        const { data: progressData, error: progressError } = await client
            .from("user_series_progress")
            .select("*")
            .eq("user_id", user.id);

        if (progressError) throw progressError;

        // Build progress map
        const progressMap = new Map(
            progressData?.map((p) => [p.series_id, p.current_episode]) || []
        );

        return NextResponse.json({
            series: series || [],
            progress: Object.fromEntries(progressMap),
        });
    } catch (error) {
        console.error("Error fetching series:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
