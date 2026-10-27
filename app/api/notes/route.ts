import { saveEpisodeNote, TrackingInputError } from "@/lib/tracking";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validateNoteInput } from "@/lib/validation";

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
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const validation = validateNoteInput(await request.json());
        if (!validation.ok) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 },
            );
        }
        const { seriesId, episodeNumber, note } = validation.value;

        const data = await saveEpisodeNote(seriesId, episodeNumber, note);

        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof TrackingInputError)
            return NextResponse.json({ error: error.message }, { status: 400 });
        if (error instanceof SyntaxError)
            return NextResponse.json(
                { error: "Invalid JSON" },
                { status: 400 },
            );
        console.error("episode_note_write_failed");
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
