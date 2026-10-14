import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/progress";
import { buttonClasses } from "@/app/components/atoms";

type Status = "pending" | "published" | "rejected";
const STATUSES: Status[] = ["pending", "published", "rejected"];

const STATUS_STYLE: Record<
    Status,
    { chip: string; border: string; label: string }
> = {
    pending: {
        chip: "tdx-chip-warn",
        border: "border-l-[var(--warning)]",
        label: "Pending",
    },
    published: {
        chip: "tdx-chip-ok",
        border: "border-l-[var(--accent-primary)]",
        label: "Published",
    },
    rejected: {
        chip: "",
        border: "border-l-[var(--text-muted)]",
        label: "Rejected",
    },
};

function shortDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
    });
}

export default async function Submissions({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login");
    const { status: rawStatus } = await searchParams;
    const filter = (STATUSES as string[]).includes(rawStatus ?? "")
        ? (rawStatus as Status)
        : null;
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
    const all = submissions ?? [];
    const counts = Object.fromEntries(
        STATUSES.map((s) => [s, all.filter((x) => x.status === s).length]),
    ) as Record<Status, number>;
    const shown = filter ? all.filter((s) => s.status === filter) : all;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex items-baseline gap-2.5">
                    <h1 className="text-[20px] tracking-[-0.02em]">
                        My submissions
                    </h1>
                    <span className="text-xs text-[var(--text-muted)]">
                        {all.length} all time
                    </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {admin && (
                        <Link
                            className="text-xs text-[var(--accent-primary)]"
                            href="/admin"
                        >
                            Review queue →
                        </Link>
                    )}
                    <Link
                        className={buttonClasses({ variant: "secondary", size: "sm" })}
                        href="/community/new"
                    >
                        <Plus size={13} aria-hidden />
                        Add a title
                    </Link>
                </div>
            </div>

            <nav aria-label="Status" className="flex gap-2 mt-3.5 mb-4 flex-wrap">
                <Link
                    href="/community/submissions"
                    className="tdx-pill"
                    aria-current={filter === null ? "page" : undefined}
                >
                    All
                </Link>
                {STATUSES.map((s) => (
                    <Link
                        key={s}
                        href={`/community/submissions?status=${s}`}
                        className="tdx-pill"
                        aria-current={filter === s ? "page" : undefined}
                    >
                        {STATUS_STYLE[s].label} {counts[s]}
                    </Link>
                ))}
            </nav>

            {shown.length === 0 ? (
                <div className="tdx-callout tdx-callout-quiet">
                    {all.length === 0
                        ? "Nothing submitted yet. Add a title or suggest a correction from any title page."
                        : "Nothing with that status."}
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {shown.map((s) => {
                        const style = STATUS_STYLE[s.status as Status] ?? STATUS_STYLE.pending;
                        const kind = s.series_id && s.status !== "published"
                            ? "Correction"
                            : s.series_id && s.payload?.episodes?.length
                              ? "Correction"
                              : "New title";
                        return (
                            <article
                                key={s.id}
                                className={`tdx-panel p-3.5 border-l-[3px] ${style.border}`}
                            >
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-[13.5px] font-medium">
                                        {s.status === "published" && s.series_id ? (
                                            <Link
                                                href={`/series/${s.series_id}`}
                                                className="hover:text-[var(--accent-primary)]"
                                            >
                                                {s.payload.title}
                                            </Link>
                                        ) : (
                                            s.payload.title
                                        )}
                                    </h2>
                                    <span className={`tdx-chip ${style.chip}`}>
                                        {style.label}
                                    </span>
                                </div>
                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-1.5 leading-[1.5]">
                                    {s.status === "published"
                                        ? `${kind} · live since ${shortDate(s.reviewed_at ?? s.created_at)}`
                                        : `${kind} · submitted ${relativeTime(s.created_at)}`}
                                </p>
                                {s.status === "rejected" && s.reason && (
                                    <p className="text-[11.5px] text-[var(--text-secondary)] mt-1 leading-[1.5]">
                                        Reason from the reviewer: &ldquo;{s.reason}&rdquo;
                                    </p>
                                )}
                                {s.status === "rejected" && (
                                    <Link
                                        className={buttonClasses({
                                            size: "sm",
                                            className: "mt-2.5",
                                        })}
                                        href={`/community/new?resubmit=${s.id}`}
                                    >
                                        Submit a revision
                                    </Link>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 tdx-panel p-3.5 text-[11.5px] text-[var(--text-secondary)] leading-[1.6]">
                <p>
                    Your member ID:{" "}
                    <code className="text-[var(--text-primary)]">{user.id}</code>
                </p>
                {trust ? (
                    <p className="mt-1">
                        Publishing trust: {trust.kind}
                        {trust.expires_at
                            ? ` · expires ${new Date(trust.expires_at).toLocaleDateString()}`
                            : ""}
                        . Expired trust returns new submissions to review.
                    </p>
                ) : (
                    <p className="mt-1">
                        Submissions are reviewed by an admin before they go
                        live. Ten attempts per day.
                    </p>
                )}
            </div>
        </div>
    );
}
