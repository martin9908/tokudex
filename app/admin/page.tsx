import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActionForm from "../components/forms/ActionForm";
import SubmissionForm from "../community/SubmissionForm";
import {
    grantTrust,
    reviewSubmission,
    moderateTitle,
    resolveReport,
} from "../community/actions";
export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ id?: string; q?: string }>;
}) {
    const client = await createClient();
    const { data: admin } = await client.rpc("is_catalog_admin");
    if (!admin) notFound();
    const { id, q = "" } = await searchParams;
    const [
        { data: queue, error },
        { data: trust },
        { data: reports },
        { data: history },
        { data: item },
        { data: titles },
    ] = await Promise.all([
        client
            .from("catalog_submissions")
            .select("*")
            .eq("status", "pending")
            .order("created_at")
            .limit(100),
        client
            .from("catalog_trust")
            .select("*")
            .order("granted_at", { ascending: false })
            .limit(100),
        client
            .from("catalog_reports")
            .select("*,series(title)")
            .eq("resolved", false)
            .order("created_at")
            .limit(100),
        client
            .from("catalog_history")
            .select("*")
            .eq("series_id", id ?? "00000000-0000-0000-0000-000000000000")
            .order("revision", { ascending: false }),
        client
            .from("series")
            .select("*")
            .eq("id", id ?? "00000000-0000-0000-0000-000000000000")
            .maybeSingle(),
        client
            .from("series")
            .select("id,title,hidden")
            .ilike(
                "title",
                `%${q.slice(0, 200).replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
            )
            .order("title")
            .limit(24),
    ]);
    if (error) throw new Error("Could not load moderation queue.");
    return (
        <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
            <h1 className="text-3xl font-bold">Community management</h1>
            <section className="tdx-panel p-4 space-y-4">
                <h2 className="text-xl font-semibold">Publishing trust</h2>
                <p>
                    Verify payment externally before granting supporter access.
                    Use its paid-through date; no payment evidence is stored
                    here.
                </p>
                <ActionForm action={grantTrust}>
                    <label className="block">
                        Member ID
                        <input
                            required
                            name="user_id"
                            className="tdx-field p-2"
                        />
                    </label>
                    <label className="block">
                        Trust type
                        <select name="kind" className="tdx-field p-2">
                            <option value="contributor">Contributor</option>
                            <option value="supporter">Paid supporter</option>
                        </select>
                    </label>
                    <label className="block">
                        Expires at in UTC (required for supporters)
                        <input
                            type="datetime-local"
                            name="expires_at"
                            className="tdx-field p-2"
                        />
                    </label>
                    <button className="border rounded-lg p-2">
                        Grant trust
                    </button>
                </ActionForm>
                {(trust ?? []).map((t) => (
                    <ActionForm key={t.user_id} action={grantTrust}>
                        <input type="hidden" name="user_id" value={t.user_id} />
                        <input type="hidden" name="revoke" value="yes" />
                        <p>
                            {t.user_id} · {t.kind} ·{" "}
                            {t.expires_at
                                ? new Date(t.expires_at).toLocaleString()
                                : "No expiry"}
                        </p>
                        <button className="underline">Revoke trust</button>
                    </ActionForm>
                ))}
            </section>
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Pending submissions</h2>
                {!queue?.length && <p>No pending submissions.</p>}
                {(queue ?? []).map((s) => (
                    <details className="tdx-panel p-4" key={s.id}>
                        <summary className="cursor-pointer">
                            {s.payload.title} ·{" "}
                            {new Date(s.created_at).toLocaleDateString()}
                        </summary>
                        <p className="my-3">
                            Contributor: {s.author_id ?? "Deleted account"}
                        </p>
                        <SubmissionForm
                            initial={s.payload}
                            initialSources={s.sources}
                            seriesId={s.series_id ?? undefined}
                            revision={s.base_revision ?? undefined}
                            reviewId={s.id}
                        />
                        <ActionForm action={reviewSubmission}>
                            <input type="hidden" name="id" value={s.id} />
                            <input
                                type="hidden"
                                name="decision"
                                value="reject"
                            />
                            <label className="block">
                                Rejection reason
                                <textarea
                                    required
                                    maxLength={2000}
                                    name="reason"
                                    className="tdx-field p-2"
                                />
                            </label>
                            <button className="border rounded-lg p-2">
                                Reject submission
                            </button>
                        </ActionForm>
                    </details>
                ))}
            </section>
            <section className="tdx-panel p-4 space-y-4">
                <h2 className="text-xl font-semibold">Reports</h2>
                {!reports?.length && <p>No open reports.</p>}
                {(reports ?? []).map((r) => (
                    <article
                        className="border-b border-cyan-900 pb-3"
                        key={r.id}
                    >
                        <Link
                            className="underline"
                            href={`/admin?id=${r.series_id}`}
                        >
                            {r.series?.title ?? r.series_id}
                        </Link>
                        <p>{r.reason}</p>
                        <ActionForm action={resolveReport}>
                            <input type="hidden" name="id" value={r.id} />
                            <button className="underline">
                                Resolve report
                            </button>
                        </ActionForm>
                    </article>
                ))}
            </section>
            <section className="tdx-panel p-4 space-y-4">
                <h2 className="text-xl font-semibold">
                    Title history and visibility
                </h2>
                <form className="flex gap-3">
                    <label className="flex-1">
                        Find a title
                        <input
                            name="q"
                            defaultValue={q}
                            className="tdx-field p-2"
                            required
                        />
                    </label>
                    <button className="underline">Load title</button>
                </form>
                <ul className="space-y-2">
                    {(titles ?? []).map((title) => (
                        <li key={title.id}>
                            <Link
                                className="text-cyan-300"
                                href={`/admin?id=${title.id}`}
                            >
                                {title.title}
                                {title.hidden ? " (hidden)" : ""}
                            </Link>
                        </li>
                    ))}
                </ul>
                {item && (
                    <>
                        <h3 className="text-xl">
                            {item.title} · revision {item.revision}
                        </h3>
                        <ActionForm action={moderateTitle}>
                            <input type="hidden" name="id" value={item.id} />
                            <input
                                type="hidden"
                                name="revision"
                                value={item.revision}
                            />
                            <input
                                type="hidden"
                                name="hidden"
                                value={String(!item.hidden)}
                            />
                            <button className="border rounded-lg p-2">
                                {item.hidden ? "Show title" : "Hide title"}
                            </button>
                        </ActionForm>
                        <ActionForm action={moderateTitle}>
                            <input type="hidden" name="id" value={item.id} />
                            <input
                                type="hidden"
                                name="revision"
                                value={item.revision}
                            />
                            <label className="block">
                                Approved Supabase poster URL (blank removes)
                                <input
                                    name="cover"
                                    type="url"
                                    defaultValue={item.cover_image_url ?? ""}
                                    className="tdx-field p-2"
                                />
                            </label>
                            <button className="border rounded-lg p-2">
                                Save poster
                            </button>
                        </ActionForm>
                        {(history ?? []).map((h) => (
                            <details key={h.id}>
                                <summary className="cursor-pointer">
                                    Revision {h.revision} ·{" "}
                                    {new Date(h.created_at).toLocaleString()} ·{" "}
                                    {h.snapshot.title}
                                </summary>
                                <p>{h.snapshot.synopsis}</p>
                                <p>
                                    Actor:{" "}
                                    {h.actor_id ??
                                        "Initial catalog / deleted account"}
                                </p>
                                <ul>
                                    {h.sources.map((source: string) => (
                                        <li key={source}>
                                            <a
                                                href={source}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline"
                                            >
                                                {source}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                                {h.revision !== item.revision && (
                                    <ActionForm action={moderateTitle}>
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={item.id}
                                        />
                                        <input
                                            type="hidden"
                                            name="revision"
                                            value={item.revision}
                                        />
                                        <input
                                            type="hidden"
                                            name="history_id"
                                            value={h.id}
                                        />
                                        <p>
                                            Restores title details and episodes
                                            as a new revision. Private tracking
                                            stays intact; visibility is managed
                                            separately.
                                        </p>
                                        <button className="border rounded-lg p-2">
                                            Restore revision {h.revision}
                                        </button>
                                    </ActionForm>
                                )}
                            </details>
                        ))}
                    </>
                )}
            </section>
        </div>
    );
}
