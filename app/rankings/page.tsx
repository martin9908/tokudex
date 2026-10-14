import type { Metadata } from "next";
import { getCatalogPage, getNearlyRanked } from "@/lib/catalogQueries";
import type { CatalogFilter } from "@/lib/catalog";
import RankingsTable from "./RankingsTable";
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
    const params = await searchParams;
    const [catalog, nearly] = await Promise.all([
        getCatalogPage(params, true),
        getNearlyRanked(),
    ]);
    const showNearly = !params.q && catalog.page === 1;
    return (
        <RankingsTable
            series={catalog.items}
            {...catalog}
            filter={catalog.filter as CatalogFilter}
            nearly={showNearly ? nearly : []}
        />
    );
}
