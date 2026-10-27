import Link from "next/link";
import { notFound } from "next/navigation";
import {
    LinkSimple,
    Warning,
    Flag,
    Check,
    ClockCounterClockwise,
} from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/progress";
import { buttonClasses } from "../components/atoms";
import ActionForm from "../components/forms/ActionForm";
import SubmissionForm from "../community/SubmissionForm";
import PosterPicker from "./PosterPicker";
import {
    grantTrust,
    reviewSubmission,
    moderateTitle,
    resolveReport,
} from "../community/actions";

type Tab = "new" | "corrections" | "reports";

const EMPTY_ID = "00000000-0000-0000-0000-000000000000";

function shortId(id: string | null) {
    return id ? `@${id.slice(0, 8)}` : "deleted account";
}

function when(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

type Snapshot = {
    title?: string;
    synopsis?: string | null;
    cover_image_url?: string | null;
    franchise?: string | null;
    total_episodes?: number | null;
    release_year?: number | null;
    episodes?: { episode_number: number; title: string; episode_type?: string | null }[];
};

/** One-line summary of what a revision changed against the one before it. */
function describeChange(snap: Snapshot, prev: Snapshot | null): { what: string; detail: string } {
    if (!prev)
        return {
            what: "Published",
            detail: `First revision · ${snap.episodes?.length ?? 0} episodes`,
        };
    const changes: string[] = [];
    const details: string[] = [];
    if (snap.title !== prev.title) {
        changes.push("Title");
        details.push(`“${prev.title}” → “${snap.title}”`);
    }
    if (snap.synopsis !== prev.synopsis) changes.push("Synopsis");
    if (snap.cover_image_url !== prev.cover_image_url) {
        changes.push("Poster");
        details.push(
            `${prev.cover_image_url?.split("/").pop() ?? "none"} → ${snap.cover_image_url?.split("/").pop() ?? "none"}`,
        );
    }
    if (snap.franchise !== prev.franchise) changes.push("Franchise");
    if (snap.total_episodes !== prev.total_episodes) {
        changes.push("Episode count");
        details.push(`${prev.total_episodes ?? "?"} → ${snap.total_episodes ?? "?"}`);
    }
    if (snap.release_year !== prev.release_year) changes.push("Release year");
    const prevEps = new Map((prev.episodes ?? []).map((e) => [e.episode_number, e]));
    const changed = (snap.episodes ?? []).filter((e) => {
        const p = prevEps.get(e.episode_number);
        return !p || p.title !== e.title || (p.episode_type ?? null) !== (e.episode_type ?? null);
    });
    if (changed.length || (snap.episodes?.length ?? 0) !== (prev.episodes?.length ?? 0)) {
        changes.push(
            changed.length === 1
                ? `Episode ${changed[0].episode_number}`
                : `${changed.length || Math.abs((snap.episodes?.length ?? 0) - (prev.episodes?.length ?? 0))} episodes`,
        );
        if (changed.length === 1) {
            const p = prevEps.get(changed[0].episode_number);
            if (p && p.title !== changed[0].title)
                details.push(`“${p.title}” → “${changed[0].title}”`);
        }
    }
    return {
        what: changes.length ? changes.join(", ") : "Moderation",
        detail: details.join(" · ") || "Visibility or poster refreshed",
    };
}

export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ id?: string; q?: string; tab?: string; poster?: string }>;
}) {
    const client = await createClient();
    const { data: admin } = await client.rpc("is_catalog_admin");
    if (!admin) notFound();
    const { id, q = "", tab: rawTab, poster = "" } = await searchParams;
    const tab: Tab =
        rawTab === "corrections" || rawTab === "reports" ? rawTab : "new";
    const [
        { data: queue, error },
        { data: trust },
        { data: reports },
        { data: history },
        { data: item },
        { data: titles },
        { data: published },
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
            .select("*,series(title,revision,hidden)")
            .order("created_at", { ascending: false })
            .limit(100),
        client
            .from("catalog_history")
            .select("*")
            .eq("series_id", id ?? EMPTY_ID)
            .order("revision", { ascending: false }),
        client
            .from("series")
            .select("*")
            .eq("id", id ?? EMPTY_ID)
            .maybeSingle(),
        q
            ? client
                  .from("series")
                  .select("id,title,hidden")
                  .ilike(
                      "title",
                      `%${q.slice(0, 200).replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
                  )
                  .order("title")
                  .limit(24)
            : Promise.resolve({ data: [] as { id: string; title: string; hidden: boolean }[] }),
        client
            .from("catalog_submissions")
            .select("author_id,status")
            .in("status", ["published", "rejected"]),
    ]);
    if (error) throw new Error("Could not load moderation queue.");

    const pending = queue ?? [];
    const newTitles = pending.filter((s) => !s.series_id);
    const corrections = pending.filter((s) => Boolean(s.series_id));
    const openReports = (reports ?? []).filter((r) => !r.resolved);
    const resolvedReports = (reports ?? []).filter((r) => r.resolved).slice(0, 5);
    const trustByUser = new Map((trust ?? []).map((t) => [t.user_id, t]));
    const record = new Map<string, { published: number; rejected: number }>();
    for (const row of published ?? []) {
        if (!row.author_id) continue;
        const r = record.get(row.author_id) ?? { published: 0, rejected: 0 };
        if (row.status === "published") r.published += 1;
        else r.rejected += 1;
        record.set(row.author_id, r);
    }

    // Duplicate check for each new-title submission, so the reviewer sees the
    // near match before deciding whether to publish new or as a correction.
    const duplicateChecks = await Promise.all(
        newTitles.map(async (s) => {
            const { data } = await client.rpc("catalog_duplicates", {
                p_title: s.payload.title,
                p_category: s.payload.category,
                p_format: s.payload.format,
                p_year: s.payload.release_year ?? null,
            });
            return [s.id, (data ?? []) as { id: string; title: string; category: string; format: string; release_year: number | null }[]] as const;
        }),
    );
    const duplicates = new Map(duplicateChecks);

    const shown = tab === "new" ? newTitles : tab === "corrections" ? corrections : [];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 flex flex-col gap-6">
            <section>
                <div className="flex items-baseline gap-2.5">
                    <h1 className="text-[20px] tracking-[-0.02em]">Review queue</h1>
                    <span className="tdx-chip tdx-chip-accent">Admin</span>
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                        {pending.length} waiting
                    </span>
                </div>
                <nav aria-label="Queue" className="flex gap-2 mt-3.5 mb-4 flex-wrap">
                    <Link href="/admin?tab=new" className="tdx-pill" aria-current={tab === "new" ? "page" : undefined}>
                        New titles {newTitles.length}
                    </Link>
                    <Link href="/admin?tab=corrections" className="tdx-pill" aria-current={tab === "corrections" ? "page" : undefined}>
                        Corrections {corrections.length}
                    </Link>
                    <Link href="/admin?tab=reports" className="tdx-pill" aria-current={tab === "reports" ? "page" : undefined}>
                        Reports {openReports.length}
                    </Link>
                </nav>

                {tab !== "reports" && shown.length === 0 && (
                    <div className="tdx-callout tdx-callout-quiet">
                        Nothing waiting here.
                    </div>
                )}

                {tab !== "reports" && (
                    <div className="flex flex-col gap-3.5">
                        {shown.map((s) => {
                            const p = s.payload;
                            const t = s.author_id ? trustByUser.get(s.author_id) : null;
                            const rec = s.author_id ? record.get(s.author_id) : null;
                            const near = (duplicates.get(s.id) ?? []).filter((d) => d.id !== s.series_id);
                            return (
                                <article key={s.id} className="tdx-panel p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-14 h-[75px] flex-none tdx-poster-pending text-[9.5px] p-1">
                                            No
                                            <br />
                                            poster
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-[15px] font-medium">
                                                    {p.title}
                                                </h2>
                                                <span className="tdx-chip capitalize">
                                                    {p.category} · {p.format}
                                                </span>
                                                {s.series_id && (
                                                    <Link
                                                        href={`/series/${s.series_id}`}
                                                        className="text-[11px] text-[var(--accent-primary)]"
                                                    >
                                                        correction to an existing title →
                                                    </Link>
                                                )}
                                            </div>
                                            <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
                                                {shortId(s.author_id)}
                                                {t ? ` · ${t.kind === "supporter" ? "paid supporter" : "trusted contributor"}` : ""}
                                                {rec
                                                    ? ` · ${rec.published} published, ${rec.rejected} rejected`
                                                    : " · first submission"}
                                                {" · "}
                                                {relativeTime(s.created_at)}
                                            </p>
                                            <ul className="mt-1.5 flex flex-col gap-0.5">
                                                {s.sources.map((source: string) => (
                                                    <li key={source}>
                                                        <a
                                                            href={source}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--accent-primary)] break-all"
                                                        >
                                                            <LinkSimple size={12} aria-hidden />
                                                            {source}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {!s.series_id && (
                                        <div className="mt-3 p-3 rounded-md bg-[var(--background)] border border-[var(--line)]">
                                            <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--text-muted)] mb-1.5">
                                                Duplicate check
                                            </p>
                                            {near.length === 0 ? (
                                                <p className="text-[12.5px] text-[var(--text-secondary)] flex items-center gap-2">
                                                    <Check size={14} className="text-[var(--accent-primary)]" aria-hidden />
                                                    No near match in the catalog.
                                                </p>
                                            ) : (
                                                <p className="text-[12.5px] text-[var(--warning)] flex gap-2 items-start">
                                                    <Warning size={14} className="mt-0.5 flex-none" aria-hidden />
                                                    <span>
                                                        {near.length === 1 ? "One near match" : `${near.length} near matches`} in the catalog:{" "}
                                                        {near.map((d, i) => (
                                                            <span key={d.id}>
                                                                {i > 0 && ", "}
                                                                <Link href={`/admin?id=${d.id}`} className="font-medium underline underline-offset-2">
                                                                    {d.title} · {d.category} · {d.format}{d.release_year ? ` · ${d.release_year}` : ""}
                                                                </Link>
                                                            </span>
                                                        ))}
                                                        . Publishing this as a correction to that entry keeps its progress rows; publishing it new does not.
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-xs">
                                        <div>
                                            <dt className="text-[var(--text-muted)]">
                                                {p.format === "movie" ? "Runtime" : "Episodes"}
                                            </dt>
                                            <dd className="mt-0.5">
                                                {p.format === "movie"
                                                    ? p.runtime_minutes ? `${p.runtime_minutes} min` : "—"
                                                    : p.total_episodes ?? "unknown"}
                                                {p.episodes?.length ? ` · ${p.episodes.length} listed` : ""}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-[var(--text-muted)]">Franchise</dt>
                                            <dd className="mt-0.5">{p.franchise ?? "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[var(--text-muted)]">Release year</dt>
                                            <dd className="mt-0.5">{p.release_year ?? "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[var(--text-muted)]">Poster</dt>
                                            <dd className="mt-0.5 text-[var(--text-secondary)]">
                                                Assign after publishing
                                            </dd>
                                        </div>
                                    </dl>
                                    {p.synopsis && (
                                        <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
                                            {p.synopsis}
                                        </p>
                                    )}

                                    <div className="flex gap-2 mt-4 flex-wrap items-start">
                                        <ActionForm action={reviewSubmission} className="">
                                            <input type="hidden" name="id" value={s.id} />
                                            <input type="hidden" name="decision" value="approve" />
                                            <button className={buttonClasses()}>
                                                Approve and publish
                                            </button>
                                        </ActionForm>
                                        {s.series_id && (
                                            <Link href={`/admin?id=${s.series_id}`} className={buttonClasses({ variant: "secondary" })}>
                                                Open the title
                                            </Link>
                                        )}
                                        <details className="ml-auto">
                                            <summary className={buttonClasses({ variant: "ghost", className: "list-none" })}>
                                                Reject with reason
                                            </summary>
                                            <ActionForm action={reviewSubmission} className="mt-2 w-[320px] max-w-full">
                                                <input type="hidden" name="id" value={s.id} />
                                                <input type="hidden" name="decision" value="reject" />
                                                <label className="tdx-label">
                                                    Reason the contributor will see
                                                    <textarea
                                                        required
                                                        maxLength={2000}
                                                        name="reason"
                                                        className="tdx-field mt-1 min-h-[62px] text-[12.5px]"
                                                        placeholder="Almost there — we just need an https source link for the episode count."
                                                    />
                                                </label>
                                                <button className={buttonClasses({ variant: "danger", size: "sm" })}>
                                                    Reject submission
                                                </button>
                                            </ActionForm>
                                        </details>
                                    </div>
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-xs text-[var(--accent-primary)]">
                                            Edit then publish
                                        </summary>
                                        <div className="mt-3 pt-3 border-t border-[var(--line)]">
                                            <SubmissionForm
                                                initial={s.payload}
                                                initialSources={s.sources}
                                                seriesId={s.series_id ?? undefined}
                                                revision={s.base_revision ?? undefined}
                                                reviewId={s.id}
                                            />
                                        </div>
                                    </details>
                                </article>
                            );
                        })}
                    </div>
                )}

                {tab === "reports" && (
                    <div className="flex flex-col gap-3.5">
                        {openReports.length === 0 && (
                            <div className="tdx-callout tdx-callout-quiet">No open reports.</div>
                        )}
                        {openReports.map((r) => (
                            <article key={r.id} className="tdx-panel p-3.5 border-l-[3px] border-l-[var(--warning)]">
                                <div className="flex items-center gap-2">
                                    <Flag size={16} className="text-[var(--warning)]" aria-hidden />
                                    <h2 className="text-[13.5px] font-medium">
                                        {r.series?.title ?? r.series_id}
                                    </h2>
                                    {r.series?.hidden && <span className="tdx-chip">Hidden</span>}
                                </div>
                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-1.5 leading-[1.5]">
                                    Reported by {shortId(r.author_id)} · &ldquo;{r.reason}&rdquo;
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                                    Reported {relativeTime(r.created_at)}
                                </p>
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    <Link href={`/admin?id=${r.series_id}`} className={buttonClasses({ size: "sm" })}>
                                        Open the title
                                    </Link>
                                    <ActionForm action={resolveReport} className="">
                                        <input type="hidden" name="id" value={r.id} />
                                        <button className={buttonClasses({ variant: "secondary", size: "sm" })}>
                                            Dismiss
                                        </button>
                                    </ActionForm>
                                    {r.series && !r.series.hidden && (
                                        <ActionForm action={moderateTitle} className="">
                                            <input type="hidden" name="id" value={r.series_id} />
                                            <input type="hidden" name="revision" value={r.series.revision} />
                                            <input type="hidden" name="hidden" value="true" />
                                            <button className={buttonClasses({ variant: "secondary", size: "sm" })}>
                                                Hide title
                                            </button>
                                        </ActionForm>
                                    )}
                                </div>
                            </article>
                        ))}
                        {resolvedReports.map((r) => (
                            <div key={r.id} className="tdx-panel px-3.5 py-3 flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                                <Check size={15} className="text-[var(--accent-primary)]" aria-hidden />
                                <span className="flex-1 truncate">
                                    {r.series?.title ?? r.series_id} · {r.reason}
                                </span>
                                <span className="text-[var(--text-muted)]">Resolved</span>
                            </div>
                        ))}
                        <p className="text-[11.5px] text-[var(--text-muted)] leading-[1.5]">
                            Hiding a title keeps everyone&apos;s progress rows — it only removes it from the catalog and rankings.
                        </p>
                    </div>
                )}
            </section>

            <section className="tdx-panel p-4">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                    <h2 className="text-[17px] tracking-[-0.01em]">Titles</h2>
                    <span className="text-xs text-[var(--text-muted)]">
                        poster assignment, visibility, revision history
                    </span>
                </div>
                <form className="flex gap-2 mt-3">
                    <input
                        name="q"
                        defaultValue={q}
                        className="tdx-field flex-1 min-h-[36px] py-1.5"
                        placeholder="Find a title"
                        aria-label="Find a title"
                        required
                    />
                    {id && <input type="hidden" name="id" value={id} />}
                    <button className={buttonClasses({ variant: "secondary" })}>Search</button>
                </form>
                {(titles ?? []).length > 0 && (
                    <ul className="flex flex-wrap gap-2 mt-3">
                        {(titles ?? []).map((title) => (
                            <li key={title.id}>
                                <Link className="tdx-pill" href={`/admin?id=${title.id}`}>
                                    {title.title}
                                    {title.hidden ? " · hidden" : ""}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {item && (
                <>
                    <section className="tdx-panel p-4">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                            <h2 className="text-[19px] tracking-[-0.02em]">{item.title}</h2>
                            <span className="text-xs text-[var(--text-muted)]">
                                revision {item.revision}
                                {item.hidden ? " · hidden" : ""}
                            </span>
                            <Link href={`/series/${item.id}`} className="ml-auto text-xs text-[var(--accent-primary)]">
                                View public page →
                            </Link>
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                            <ActionForm action={moderateTitle} className="">
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="revision" value={item.revision} />
                                <input type="hidden" name="hidden" value={String(!item.hidden)} />
                                <button className={buttonClasses({ variant: "secondary", size: "sm" })}>
                                    {item.hidden ? "Show title" : "Hide title"}
                                </button>
                            </ActionForm>
                            <Link href={`/community/new?id=${item.id}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                                Edit as a correction
                            </Link>
                        </div>
                    </section>

                    <PosterPicker
                        item={{
                            id: item.id,
                            title: item.title,
                            revision: item.revision,
                            hidden: item.hidden,
                            cover_image_url: item.cover_image_url,
                        }}
                        search={poster}
                    />

                    <section className="tdx-panel p-4">
                        <div className="flex items-baseline gap-2.5">
                            <h2 className="text-[17px] tracking-[-0.01em]">Revision history</h2>
                            <span className="ml-auto text-xs text-[var(--text-muted)]">
                                {history?.length ?? 0} revisions
                            </span>
                        </div>
                        <div className="flex flex-col mt-2 overflow-x-auto">
                            <div className="grid grid-cols-[110px_1fr_110px_80px] gap-3.5 px-3 pb-2 text-[10px] tracking-[0.1em] uppercase text-[var(--text-muted)] border-b border-[var(--line)] min-w-[520px]">
                                <span>When</span>
                                <span>What changed</span>
                                <span>Who</span>
                                <span />
                            </div>
                            {(history ?? []).map((h, i, arr) => {
                                const prev = arr[i + 1]?.snapshot ?? null;
                                const { what, detail } = describeChange(h.snapshot, prev);
                                const current = h.revision === item.revision;
                                return (
                                    <div
                                        key={h.id}
                                        className={`tdx-row grid grid-cols-[110px_1fr_110px_80px] gap-3.5 items-center px-3 py-3 min-w-[520px] ${current ? "border-l-2 border-l-[var(--accent-primary)]" : ""}`}
                                    >
                                        <span className="text-xs text-[var(--text-secondary)]">
                                            {when(h.created_at)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px]">{what}</p>
                                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                                                {detail}
                                            </p>
                                        </div>
                                        <span className="text-xs">{shortId(h.actor_id) === "deleted account" ? "catalog import" : shortId(h.actor_id)}</span>
                                        {current ? (
                                            <span className="text-right text-[11.5px] text-[var(--accent-primary)]">
                                                Current
                                            </span>
                                        ) : (
                                            <ActionForm action={moderateTitle} className="text-right">
                                                <input type="hidden" name="id" value={item.id} />
                                                <input type="hidden" name="revision" value={item.revision} />
                                                <input type="hidden" name="history_id" value={h.id} />
                                                <button className="tdx-focus-ring text-[11.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded">
                                                    Revert
                                                </button>
                                            </ActionForm>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="tdx-callout tdx-callout-line items-center mt-3.5">
                            <ClockCounterClockwise size={16} aria-hidden />
                            Reverting restores that revision&apos;s fields and episodes as a new revision and leaves every progress row untouched. Visibility is managed separately.
                        </div>
                    </section>
                </>
            )}

            <details className="tdx-panel p-4">
                <summary className="cursor-pointer text-sm">
                    Publishing trust
                    <span className="ml-2 text-xs text-[var(--text-muted)]">
                        {(trust ?? []).length} members
                    </span>
                </summary>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-2 leading-[1.5]">
                    Verify payment externally before granting supporter access. Use its paid-through date; no payment evidence is stored here.
                </p>
                <ActionForm action={grantTrust} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <label className="tdx-label mb-0">
                        Member ID
                        <input required name="user_id" className="tdx-field mt-1 min-h-[36px] py-1.5" />
                    </label>
                    <label className="tdx-label mb-0">
                        Trust type
                        <select name="kind" className="tdx-field mt-1 min-h-[36px] py-1.5">
                            <option value="contributor">Contributor</option>
                            <option value="supporter">Paid supporter</option>
                        </select>
                    </label>
                    <label className="tdx-label mb-0">
                        Expires (UTC, required for supporters)
                        <input type="datetime-local" name="expires_at" className="tdx-field mt-1 min-h-[36px] py-1.5" />
                    </label>
                    <div className="sm:col-span-3">
                        <button className={buttonClasses({ size: "sm" })}>Grant trust</button>
                    </div>
                </ActionForm>
                <ul className="mt-3 flex flex-col gap-2">
                    {(trust ?? []).map((t) => (
                        <li key={t.user_id}>
                            <ActionForm action={grantTrust} className="flex items-center gap-3 text-xs">
                                <input type="hidden" name="user_id" value={t.user_id} />
                                <input type="hidden" name="revoke" value="yes" />
                                <span className="flex-1 min-w-0 truncate">
                                    <code>{t.user_id}</code> · {t.kind} ·{" "}
                                    {t.expires_at ? new Date(t.expires_at).toLocaleString() : "no expiry"}
                                </span>
                                <button className="tdx-focus-ring text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded">
                                    Revoke
                                </button>
                            </ActionForm>
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );
}
