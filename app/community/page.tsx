import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function Submissions() {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login");
    const [{ data: submissions, error }, { data: admin }, { data: trust }] =
        await Promise.all([
            client
                .from("catalog_submissions")
                .select("*")
                .eq("author_id", user.id)
                .order("created_at", { ascending: false })
                .limit(100),
            client.rpc("is_catalog_admin"),
            client
                .from("catalog_trust")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle(),
        ]);
    if (error) throw new Error("Could not load submissions.");
    return (
        <div className="max-w-4xl mx-auto p-4 pb-24 space-y-4">
            <h1 className="text-3xl font-bold">My submissions</h1>
            <div className="flex gap-5">
                <Link className="text-cyan-300" href="/community/new">
                    Add a title
                </Link>
                {admin && (
                    <Link className="text-cyan-300" href="/admin">
                        Manage community
                    </Link>
                )}
            </div>
            <p className="text-sm">
                Your member ID: <code>{user.id}</code>
            </p>
            {trust && (
                <p>
                    Publishing trust: {trust.kind}
                    {trust.expires_at
                        ? ` · expires ${new Date(trust.expires_at).toLocaleDateString()}`
                        : ""}
                    . Expired trust returns new submissions to review.
                </p>
            )}
            {!(submissions ?? []).length && <p>No submissions yet.</p>}
            {(submissions ?? []).map((s) => (
                <article className="tdx-panel p-4 space-y-2" key={s.id}>
                    <h2 className="text-xl font-semibold">{s.payload.title}</h2>
                    <p className="capitalize">
                        {s.status} ·{" "}
                        {new Date(s.created_at).toLocaleDateString()}
                    </p>
                    {s.reason && <p>Reviewer: {s.reason}</p>}
                    {s.status === "published" && (
                        <Link
                            className="text-cyan-300"
                            href={`/series/${s.series_id}`}
                        >
                            View title →
                        </Link>
                    )}
                    {s.status === "rejected" && (
                        <Link
                            className="text-cyan-300"
                            href={`/community/new?resubmit=${s.id}`}
                        >
                            Revise and resubmit →
                        </Link>
                    )}
                </article>
            ))}
        </div>
    );
}
