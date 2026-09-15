import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmissionForm from "../SubmissionForm";
import type { CatalogPayload } from "@/lib/catalog";
export default async function NewTitle({
    searchParams,
}: {
    searchParams: Promise<{ id?: string; resubmit?: string }>;
}) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login");
    const { id, resubmit } = await searchParams;
    let initial: CatalogPayload | undefined;
    let sources: string[] = [];
    let seriesId = id;
    let revision: number | undefined;
    if (resubmit) {
        const { data } = await client
            .from("catalog_submissions")
            .select("*")
            .eq("id", resubmit)
            .eq("author_id", user.id)
            .eq("status", "rejected")
            .single();
        if (!data) notFound();
        initial = data.payload;
        sources = data.sources;
        seriesId = data.series_id ?? undefined;
    }
    if (seriesId) {
        const { data } = await client
            .from("series")
            .select("*")
            .eq("id", seriesId)
            .eq("hidden", false)
            .single();
        if (!data) notFound();
        revision = data.revision;
        if (!initial) {
            initial = { ...data, episodes: [] } as CatalogPayload;
        }
    }
    return (
        <div className="max-w-3xl mx-auto p-4 pb-24 space-y-4">
            <h1 className="text-3xl font-bold">
                {seriesId ? "Suggest a correction" : "Add a title"}
            </h1>
            <SubmissionForm
                initial={initial}
                initialSources={sources}
                seriesId={seriesId}
                revision={revision}
            />
        </div>
    );
}
