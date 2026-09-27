import { createClient } from "./supabase/server";
import {
    catalogParams,
    CATALOG_FILTERS,
    DEX_FILTERS,
    type CatalogItem,
} from "./catalog";
export async function getCatalogPage(
    input: { q?: string; filter?: string; page?: string },
    ranked = false,
    filters: "catalog" | "dex" = "catalog",
) {
    const params = catalogParams(
        input,
        filters === "dex" ? DEX_FILTERS : CATALOG_FILTERS,
    );
    const client = await createClient();
    const { data, error } = await client.rpc("catalog_page", {
        p_filter: params.filter,
        p_query: params.query,
        p_page: params.page,
        p_ranked: ranked,
    });
    if (error) throw new Error("Could not load the catalog. Please try again.");
    return {
        ...params,
        ...(data as { items: CatalogItem[]; total: number; page: number }),
    };
}
export async function getCatalogCredits(ids: string[]) {
    if (!ids.length) return {} as Record<string, string>;
    const client = await createClient();
    const { data } = await client.rpc("catalog_credits", { p_ids: ids });
    return Object.fromEntries(
        ((data ?? []) as { series_id: string; handle: string }[]).map((c) => [
            c.series_id,
            c.handle,
        ]),
    ) as Record<string, string>;
}
export async function getNearlyRanked() {
    const client = await createClient();
    const { data } = await client.rpc("catalog_nearly_ranked");
    return (data ?? []) as { series_id: string; title: string; vote_count: number }[];
}
export async function getRatingSummary(id: string) {
    const client = await createClient();
    const { data, error } = await client
        .rpc("catalog_scores")
        .eq("series_id", id)
        .maybeSingle();
    if (error) throw new Error("Could not load ratings.");
    return data as { average_score: number; vote_count: number } | null;
}
