import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
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
    let currentTitle: string | null = null;
    if (seriesId) {
        const { data } = await client
            .from("series")
            .select("*")
            .eq("id", seriesId)
            .eq("hidden", false)
            .single();
        if (!data) notFound();
        revision = data.revision;
        currentTitle = data.title;
        if (!initial) {
            initial = { ...data, episodes: [] } as CatalogPayload;
        }
    }
    const today = new Date().toISOString().slice(0, 10);
    const { data: attempts } = await client
        .from("catalog_attempts")
        .select("attempts")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle();
    const correction = Boolean(seriesId) && !resubmit;
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
            <Link
                href={seriesId ? `/series/${seriesId}` : "/community"}
                className="tdx-focus-ring inline-flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded"
            >
                <ArrowLeft size={15} aria-hidden />
                {seriesId ? currentTitle : "My submissions"}
            </Link>
            {correction ? (
                <>
                    <p className="tdx-eyebrow tdx-eyebrow-accent mt-4">
                        Suggest a correction
                    </p>
                    <h1 className="text-[22px] tracking-[-0.02em] mt-1.5">
                        {currentTitle}
                    </h1>
                    <p className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)] mt-2 mb-4 max-w-[520px]">
                        Spotted something off? Change only what&apos;s wrong —
                        everything you leave alone stays as it is.
                    </p>
                </>
            ) : (
                <>
                    <h1 className="text-[22px] tracking-[-0.02em] mt-4">
                        {resubmit ? "Revise your submission" : "Add a title to the catalog"}
                    </h1>
                    <p className="text-[13px] leading-[1.55] text-[var(--text-secondary)] mt-2 mb-4 max-w-[520px]">
                        {resubmit
                            ? "Fix what the reviewer flagged and send it back — it returns to the front of the queue."
                            : "Thanks for filling a gap. Give us what you know — an admin checks it over before it goes live, usually within a day or two."}
                    </p>
                </>
            )}
            <SubmissionForm
                initial={initial}
                initialSources={sources}
                seriesId={seriesId}
                revision={revision}
                attemptsToday={attempts?.attempts ?? 0}
            />
        </div>
    );
}
