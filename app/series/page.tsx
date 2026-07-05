import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllSeries } from "@/lib/supabase/queries";
import SeriesLibrary, { type Series } from "./SeriesLibrary";

export const metadata: Metadata = {
    title: "Series Library",
    description:
        "Browse the full tokusatsu catalog on TokuDex — Kamen Rider, Super Sentai, Ultraman and more. Track your episode progress and recaps.",
    alternates: { canonical: "/series" },
    openGraph: {
        title: "Series Library · TokuDex",
        description:
            "Browse the full tokusatsu catalog on TokuDex — Kamen Rider, Super Sentai, Ultraman and more.",
        url: "/series",
    },
};

type SeriesListPageProps = {
    searchParams: Promise<{ q?: string }>;
};

export default async function SeriesListPage({ searchParams }: SeriesListPageProps) {
    const { q } = await searchParams;
    const client = await createClient();

    const {
        data: { user },
    } = await client.auth.getUser();

    const series = (await getAllSeries()) as Series[];

    // Signed-in users get their per-series progress; guests get an empty map.
    let progress: Record<string, number> = {};
    if (user) {
        const { data: progressData } = await client
            .from("user_series_progress")
            .select("series_id, current_episode")
            .eq("user_id", user.id);
        progress = Object.fromEntries(
            (progressData ?? []).map((p) => [p.series_id, p.current_episode ?? 0])
        );
    }

    return <SeriesLibrary series={series} progress={progress} initialQuery={q ?? ""} />;
}
