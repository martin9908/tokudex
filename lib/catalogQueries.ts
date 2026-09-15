import { createClient } from "./supabase/server";
import { catalogParams, type CatalogItem } from "./catalog";
export async function getCatalogPage(
    input: { q?: string; filter?: string; page?: string },
    ranked = false,
) {
    const params = catalogParams(input);
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
export async function getRatingSummary(id: string) {
    const client = await createClient();
    const { data, error } = await client
        .rpc("catalog_scores")
        .eq("series_id", id)
        .maybeSingle();
    if (error) throw new Error("Could not load ratings.");
    return data as { average_score: number; vote_count: number } | null;
}
