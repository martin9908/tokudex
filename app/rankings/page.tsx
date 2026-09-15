import type { Metadata } from "next";
import { getCatalogPage } from "@/lib/catalogQueries";
import { RankingsTable } from "../series/SeriesLibrary";
export const metadata: Metadata = {
    title: "Community Rankings",
    description: "Discover top-rated tokusatsu, anime, and movies.",
    alternates: { canonical: "/rankings" },
};
export default async function Rankings({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
    const catalog = await getCatalogPage(await searchParams, true);
    return <RankingsTable series={catalog.items} {...catalog} />;
}
