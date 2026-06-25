import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/progress - Update or create user series progress
 */
export async function POST(request: NextRequest) {
    try {
        const client = await createClient();

        // Get authenticated user
        const {
            data: { user },
        } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            seriesId,
            currentEpisode,
            status,
        }: {
            seriesId: string;
            currentEpisode: number;
            status: "watching" | "completed" | "on_hold" | "plan_to_watch";
        } = await request.json();

        if (!seriesId || currentEpisode === undefined || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await client
            .from("user_series_progress")
            .upsert(
                {
                    user_id: user.id,
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

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error updating progress:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
