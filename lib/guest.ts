import { createClient } from "./supabase/server";

const GUEST_FRANCHISES = ["Kamen Rider", "Super Sentai", "Ultraman"];

export type GuestSeries = {
    id: string;
    title: string;
    franchise: string | null;
    total_episodes: number | null;
    synopsis: string | null;
    cover_image_url: string | null;
    original_run: string | null;
};

type SeriesRow = GuestSeries;

/**
 * The series a guest may browse: the single latest per franchise (by original
 * run). Reads public catalog tables, so it works without a signed-in user.
 */
export async function getGuestSeries(): Promise<GuestSeries[]> {
    const supabase = await createClient();

    const { data: series } = await supabase
        .from("series")
        .select("id, title, franchise, total_episodes, synopsis, cover_image_url, original_run");
    const rows = (series ?? []) as SeriesRow[];

    // The latest series per franchise, by original run (e.g. "2025-2026").
    const picks: GuestSeries[] = [];
    for (const franchise of GUEST_FRANCHISES) {
        const chosen = rows
            .filter((r) => r.franchise === franchise)
            .sort((a, b) => (b.original_run ?? "").localeCompare(a.original_run ?? ""))[0];
        if (chosen) picks.push(chosen);
    }
    return picks;
}

export async function getGuestSeriesIds(): Promise<Set<string>> {
    const series = await getGuestSeries();
    return new Set(series.map((s) => s.id));
}
