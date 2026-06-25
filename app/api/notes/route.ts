import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notes - Create or update episode note
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
            episodeNumber,
            note,
        }: {
            seriesId: string;
            episodeNumber: number;
            note: string;
        } = await request.json();

        if (!seriesId || episodeNumber === undefined || !note) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await client
            .from("episode_notes")
            .upsert(
                {
                    user_id: user.id,
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

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error saving note:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
