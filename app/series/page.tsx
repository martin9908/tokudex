import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCatalogPage } from "@/lib/catalogQueries";
import SeriesLibrary, { type LibraryProgress } from "./SeriesLibrary";
export const metadata: Metadata = {
    title: "Library",
    description:
        "Browse tokusatsu, anime, and movies. Track your progress and discover community favorites.",
    alternates: { canonical: "/series" },
};
export default async function LibraryPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
    const catalog = await getCatalogPage(await searchParams);
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    let progress: LibraryProgress = {};
    if (user && catalog.items.length) {
        const { data } = await client
            .from("user_series_progress")
            .select("series_id,current_episode,status")
            .eq("user_id", user.id)
            .in(
                "series_id",
                catalog.items.map((s) => s.id),
            );
        progress = Object.fromEntries(
            (data ?? []).map((p) => [
                p.series_id,
                { current: p.current_episode ?? 0, status: p.status ?? "watching" },
            ]),
        );
    }
    return (
        <SeriesLibrary
            series={catalog.items}
            {...catalog}
            progress={progress}
            signedIn={Boolean(user)}
        />
    );
}
