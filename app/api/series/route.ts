import { NextRequest, NextResponse } from "next/server";
import { getCatalogPage } from "@/lib/catalogQueries";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
    try {
        const catalog = await getCatalogPage(
            Object.fromEntries(request.nextUrl.searchParams),
        );
        const client = await createClient();
        const {
            data: { user },
        } = await client.auth.getUser();
        let progress: Record<string, number> = {};
        if (user && catalog.items.length) {
            const { data } = await client
                .from("user_series_progress")
                .select("series_id,current_episode")
                .eq("user_id", user.id)
                .in(
                    "series_id",
                    catalog.items.map((s) => s.id),
                );
            progress = Object.fromEntries(
                (data ?? []).map((p) => [p.series_id, p.current_episode ?? 0]),
            );
        }
        return NextResponse.json({
            series: catalog.items,
            progress,
            total: catalog.total,
            page: catalog.page,
        });
    } catch {
        return NextResponse.json(
            { error: "Could not load catalog" },
            { status: 500 },
        );
    }
}
