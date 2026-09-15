import type { MetadataRoute } from "next";
import { getAllSeries } from "@/lib/supabase/queries";
import { absoluteUrl, seriesUrl } from "@/lib/seo";

// Refresh hourly so newly added series get discovered.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let series: { id: string; created_at: string | null }[] = [];
    try {
        series = (await getAllSeries()) as typeof series;
    } catch {
        series = [];
    }

    const now = new Date();

    return [
        {
            url: absoluteUrl("/"),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: absoluteUrl("/series"),
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: absoluteUrl("/rankings"),
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.8,
        },
        ...series.map((s) => ({
            url: seriesUrl(s.id),
            lastModified: s.created_at ? new Date(s.created_at) : now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
    ];
}
