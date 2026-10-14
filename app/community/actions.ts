"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/validation";
import type { CatalogPayload } from "@/lib/catalog";
async function member(admin = false) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("Sign in to continue.");
    if (admin) {
        const { data } = await client.rpc("is_catalog_admin");
        if (!data) throw new Error("Unauthorized");
    }
    return { client, user };
}
function refresh(id?: string) {
    for (const path of [
        "/",
        "/series",
        "/rankings",
        "/community",
        "/admin",
        "/sitemap.xml",
        ...(id ? [`/series/${id}`] : []),
    ])
        revalidatePath(path);
}
export async function submitTitle(
    payload: CatalogPayload,
    sources: string[],
    id?: string,
    revision?: number,
) {
    const { client } = await member();
    const { data, error } = await client.rpc("submit_catalog", {
        p_payload: payload,
        p_sources: sources,
        p_series_id: id ?? null,
        p_base_revision: revision ?? null,
    });
    if (error || data?.error) {
        console.error("catalog_publication_failed", {
            code: error?.code ?? "validation",
        });
        throw new Error(error?.message ?? data.error);
    }
    refresh(data.series_id ?? undefined);
    return data as { id: string; series_id: string | null; published: boolean };
}
export async function findDuplicates(
    title: string,
    category: string,
    format: string,
    releaseYear: number | null,
) {
    const { client } = await member();
    const query = title.trim().slice(0, 200);
    if (query.length < 2) return [];
    const { data, error } = await client.rpc("catalog_duplicates", {
        p_title: query,
        p_category: category,
        p_format: format,
        p_year: releaseYear,
    });
    if (error) throw new Error("Could not check duplicates.");
    return data as {
        id: string;
        title: string;
        category: string;
        format: string;
        release_year: number | null;
    }[];
}
export async function reviewSubmission(form: FormData) {
    const { client } = await member(true);
    const { data, error } = await client.rpc("review_catalog", {
        p_id: form.get("id"),
        p_approve: form.get("decision") === "approve",
        p_reason: form.get("reason") || null,
        p_payload: form.get("payload")
            ? JSON.parse(String(form.get("payload")))
            : null,
        p_sources: form.get("sources")
            ? String(form.get("sources"))
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : null,
    });
    if (error) {
        console.error("catalog_publication_failed", { code: error.code });
        throw new Error(error.message);
    }
    refresh(data ?? undefined);
}
export async function grantTrust(form: FormData) {
    const { client, user } = await member(true);
    const id = String(form.get("user_id"));
    if (!isUuid(id)) throw new Error("Enter a valid member ID.");
    const { error } =
        form.get("revoke") === "yes"
            ? await client.from("catalog_trust").delete().eq("user_id", id)
            : await client.from("catalog_trust").upsert({
                  user_id: id,
                  kind: form.get("kind"),
                  expires_at: form.get("expires_at")
                      ? new Date(
                            String(form.get("expires_at")) + "Z",
                        ).toISOString()
                      : null,
                  granted_by: user.id,
              });
    if (error) throw new Error(error.message);
    refresh();
}
export async function moderateTitle(form: FormData) {
    const { client } = await member(true);
    const id = String(form.get("id"));
    const { error } = await client.rpc("moderate_catalog", {
        p_id: id,
        p_revision: Number(form.get("revision")),
        p_hidden: form.has("hidden") ? form.get("hidden") === "true" : null,
        p_cover: form.has("cover") ? String(form.get("cover")) : null,
        p_history_id: form.get("history_id") || null,
    });
    if (error) throw new Error(error.message);
    refresh(id);
}
export async function reportTitle(form: FormData) {
    const { client, user } = await member();
    const { error } = await client.from("catalog_reports").insert({
        series_id: form.get("id"),
        author_id: user.id,
        reason: form.get("reason"),
    });
    if (error) throw new Error("Could not submit report.");
    refresh();
}
export async function resolveReport(form: FormData) {
    const { client } = await member(true);
    const { error } = await client
        .from("catalog_reports")
        .update({ resolved: true })
        .eq("id", form.get("id"));
    if (error) throw new Error(error.message);
    refresh();
}
export async function rateTitle(id: string, score: number | null) {
    const { client, user } = await member();
    if (
        !isUuid(id) ||
        (score !== null &&
            (!Number.isInteger(score) || score < 1 || score > 10))
    )
        throw new Error("Choose a rating from 1 to 10.");
    const { error } =
        score === null
            ? await client
                  .from("title_ratings")
                  .delete()
                  .eq("series_id", id)
                  .eq("user_id", user.id)
            : await client
                  .from("title_ratings")
                  .upsert(
                      { series_id: id, user_id: user.id, score },
                      { onConflict: "user_id,series_id" },
                  );
    if (error) {
        console.error("rating_failed", { code: error.code });
        throw new Error(error.message);
    }
    refresh(id);
}
