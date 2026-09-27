"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "@phosphor-icons/react";
import { submitTitle, findDuplicates, reviewSubmission } from "./actions";
import {
    validateCatalogPayload,
    type CatalogPayload,
    type CatalogEpisode,
} from "@/lib/catalog";
import { EPISODE_TYPES, EPISODE_TYPE_LABELS } from "@/lib/episodeTypes";
import { buttonClasses } from "@/app/components/atoms";

const empty: CatalogPayload = {
    title: "",
    category: "tokusatsu",
    format: "series",
    franchise: null,
    total_episodes: null,
    synopsis: null,
    release_year: null,
    runtime_minutes: null,
    episodes: [],
};

const DAILY_LIMIT = 10;

function Choice<T extends string>({
    options,
    value,
    onChange,
    disabled,
    name,
}: {
    options: { value: T; label: string; disabled?: boolean }[];
    value: T;
    onChange: (v: T) => void;
    disabled?: boolean;
    name: string;
}) {
    return (
        <div role="radiogroup" className="flex gap-1.5">
            {options.map((o) => (
                <label
                    key={o.value}
                    className={`tdx-choice flex-1 ${value === o.value ? "is-active" : ""} ${
                        disabled || o.disabled ? "opacity-60 cursor-default" : ""
                    }`}
                >
                    <input
                        type="radio"
                        name={name}
                        value={o.value}
                        className="sr-only"
                        checked={value === o.value}
                        disabled={disabled || o.disabled}
                        onChange={() => onChange(o.value)}
                    />
                    {o.label}
                </label>
            ))}
        </div>
    );
}

/**
 * Add a title, or suggest a correction to one. The same form serves admin
 * review ("edit then publish") when `reviewId` is given.
 */
export default function SubmissionForm({
    initial = empty,
    initialSources = [],
    seriesId,
    revision,
    reviewId,
    attemptsToday = 0,
}: {
    initial?: CatalogPayload;
    initialSources?: string[];
    seriesId?: string;
    revision?: number;
    reviewId?: string;
    attemptsToday?: number;
}) {
    const [payload, setPayload] = useState(initial);
    const [sources, setSources] = useState(initialSources.join("\n"));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [duplicates, setDuplicates] = useState<Awaited<
        ReturnType<typeof findDuplicates>
    > | null>(null);
    const router = useRouter();
    const correction = Boolean(seriesId) && !reviewId;
    const locked = Boolean(seriesId);

    function field<K extends keyof CatalogPayload>(
        key: K,
        value: CatalogPayload[K],
    ) {
        setPayload((p) => ({ ...p, [key]: value }));
    }
    function episode(
        index: number,
        key: keyof CatalogEpisode,
        value: string | number | null,
    ) {
        field(
            "episodes",
            payload.episodes.map((ep, i) =>
                i === index ? { ...ep, [key]: value } : ep,
            ),
        );
    }
    async function checkDuplicates() {
        try {
            setDuplicates(
                await findDuplicates(
                    payload.title,
                    payload.category,
                    payload.format,
                    payload.release_year,
                ),
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : "Search failed");
        }
    }

    const nearMatches = (duplicates ?? []).filter((s) => s.id !== seriesId);

    return (
        <form
            className="flex flex-col gap-3.5"
            onSubmit={async (event) => {
                event.preventDefault();
                const links = sources
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean);
                const validation = validateCatalogPayload(payload, links);
                if (validation) {
                    setError(validation);
                    return;
                }
                setBusy(true);
                setError("");
                try {
                    if (reviewId) {
                        const form = new FormData();
                        form.set("id", reviewId);
                        form.set("decision", "approve");
                        form.set("payload", JSON.stringify(payload));
                        form.set("sources", links.join("\n"));
                        await reviewSubmission(form);
                    } else {
                        await submitTitle(payload, links, seriesId, revision);
                    }
                    router.push(reviewId ? "/admin" : "/community/submissions");
                    router.refresh();
                } catch (e) {
                    setError(
                        e instanceof Error ? e.message : "Submission failed.",
                    );
                } finally {
                    setBusy(false);
                }
            }}
        >
            <fieldset
                disabled={busy}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            >
                <div className="sm:col-span-2">
                    <label htmlFor="sub-title" className="tdx-label">
                        Title
                    </label>
                    <input
                        id="sub-title"
                        className="tdx-field"
                        required
                        maxLength={300}
                        value={payload.title}
                        onChange={(e) => {
                            field("title", e.target.value);
                            setDuplicates(null);
                        }}
                        onBlur={() => {
                            if (!correction && payload.title.trim().length >= 2)
                                checkDuplicates();
                        }}
                    />
                    {duplicates && (
                        <div
                            role="status"
                            className={`tdx-callout mt-2 text-xs ${nearMatches.length ? "tdx-callout-warn" : "tdx-callout-ok"}`}
                        >
                            <Info size={14} className="mt-0.5 flex-none" aria-hidden />
                            <span>
                                {nearMatches.length === 0 ? (
                                    "Checked for existing titles — no close match."
                                ) : (
                                    <>
                                        Checked for existing titles —{" "}
                                        {nearMatches.length === 1
                                            ? "one close match"
                                            : `${nearMatches.length} close matches`}
                                        :{" "}
                                        {nearMatches.map((s, i) => (
                                            <span key={s.id}>
                                                {i > 0 && ", "}
                                                <Link
                                                    href={`/community/new?id=${s.id}`}
                                                    className="font-medium underline underline-offset-2"
                                                >
                                                    {s.title} · {s.category} ·{" "}
                                                    {s.format}
                                                    {s.release_year
                                                        ? ` · ${s.release_year}`
                                                        : ""}
                                                </Link>
                                            </span>
                                        ))}
                                        . If that&apos;s the one, suggest a
                                        correction to it instead; it keeps
                                        everyone&apos;s tracking history in
                                        one place.
                                    </>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <span className="tdx-label">Category</span>
                    <Choice
                        name="category"
                        disabled={locked}
                        value={payload.category}
                        onChange={(v) => {
                            field("category", v);
                            if (v === "other") field("format", "movie");
                        }}
                        options={[
                            { value: "tokusatsu", label: "Tokusatsu" },
                            { value: "anime", label: "Anime" },
                            {
                                value: "other",
                                label: "Other",
                                disabled: payload.format === "series",
                            },
                        ]}
                    />
                </div>
                <div>
                    <span className="tdx-label">Format</span>
                    <Choice
                        name="format"
                        disabled={locked}
                        value={payload.format}
                        onChange={(v) => field("format", v)}
                        options={[
                            {
                                value: "series",
                                label: "Series",
                                disabled: payload.category === "other",
                            },
                            { value: "movie", label: "Movie" },
                        ]}
                    />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                        &ldquo;Other&rdquo; is only available for movies. Use a
                        separate title for each anime season.
                    </p>
                </div>

                <div>
                    <label htmlFor="sub-franchise" className="tdx-label">
                        Franchise{" "}
                        <span className="tdx-label-hint">
                            optional — groups seasons
                        </span>
                    </label>
                    <input
                        id="sub-franchise"
                        className="tdx-field"
                        maxLength={200}
                        value={payload.franchise ?? ""}
                        onChange={(e) =>
                            field("franchise", e.target.value || null)
                        }
                    />
                    <label htmlFor="sub-year" className="tdx-label mt-3">
                        Release year
                    </label>
                    <input
                        id="sub-year"
                        type="number"
                        min={1800}
                        max={2200}
                        className="tdx-field"
                        value={payload.release_year ?? ""}
                        onChange={(e) =>
                            field(
                                "release_year",
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                    />
                </div>
                <div>
                    {payload.format === "movie" ? (
                        <>
                            <label htmlFor="sub-runtime" className="tdx-label">
                                Runtime{" "}
                                <span className="tdx-label-hint">minutes</span>
                            </label>
                            <input
                                id="sub-runtime"
                                type="number"
                                min={1}
                                max={10000}
                                className="tdx-field"
                                value={payload.runtime_minutes ?? ""}
                                onChange={(e) =>
                                    field(
                                        "runtime_minutes",
                                        e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                    )
                                }
                            />
                        </>
                    ) : (
                        <>
                            <label htmlFor="sub-episodes" className="tdx-label">
                                Episodes{" "}
                                <span className="tdx-label-hint">
                                    leave blank if unknown
                                </span>
                            </label>
                            <input
                                id="sub-episodes"
                                type="number"
                                min={1}
                                max={100000}
                                className="tdx-field"
                                value={payload.total_episodes ?? ""}
                                onChange={(e) =>
                                    field(
                                        "total_episodes",
                                        e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                    )
                                }
                            />
                        </>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="sub-sources" className="tdx-label">
                        HTTPS source links{" "}
                        <span className="tdx-label-hint">
                            one per line, required
                            {correction ? " — a source helps a lot" : ""}
                        </span>
                    </label>
                    <textarea
                        id="sub-sources"
                        required
                        className="tdx-field min-h-[56px] leading-[1.6]"
                        rows={2}
                        value={sources}
                        onChange={(e) => setSources(e.target.value)}
                        placeholder="https://"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="sub-synopsis" className="tdx-label">
                        Synopsis <span className="tdx-label-hint">optional</span>
                    </label>
                    <textarea
                        id="sub-synopsis"
                        className="tdx-field min-h-[70px] text-[13px] leading-[1.5]"
                        rows={3}
                        maxLength={5000}
                        value={payload.synopsis ?? ""}
                        placeholder="A short, spoiler-free description helps other people decide where to start."
                        onChange={(e) =>
                            field("synopsis", e.target.value || null)
                        }
                    />
                </div>

                {payload.format === "series" && (
                    <section className="sm:col-span-2 mt-1">
                        <div className="flex items-baseline gap-2.5">
                            <h2 className="text-sm font-medium">
                                Episode additions and corrections
                            </h2>
                            <span className="text-[11px] text-[var(--text-muted)]">
                                only the episodes you want to add or change —
                                everything else stays as it is
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5 mt-2.5">
                            {payload.episodes.map((ep, i) => (
                                <fieldset
                                    className="tdx-panel p-3 grid grid-cols-[72px_1fr] sm:grid-cols-[72px_1fr_150px_130px] gap-2.5"
                                    key={i}
                                >
                                    <label className="tdx-label mb-0">
                                        Number
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            className="tdx-field mt-1 min-h-[36px] py-1.5"
                                            value={ep.episode_number}
                                            onChange={(e) =>
                                                episode(
                                                    i,
                                                    "episode_number",
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="tdx-label mb-0">
                                        Title
                                        <input
                                            required
                                            maxLength={300}
                                            className="tdx-field mt-1 min-h-[36px] py-1.5"
                                            value={ep.title}
                                            onChange={(e) =>
                                                episode(i, "title", e.target.value)
                                            }
                                        />
                                    </label>
                                    <label className="tdx-label mb-0">
                                        Air date
                                        <input
                                            type="date"
                                            className="tdx-field mt-1 min-h-[36px] py-1.5"
                                            value={ep.air_date ?? ""}
                                            onChange={(e) =>
                                                episode(
                                                    i,
                                                    "air_date",
                                                    e.target.value || null,
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="tdx-label mb-0">
                                        Type
                                        <select
                                            className="tdx-field mt-1 min-h-[36px] py-1.5"
                                            value={ep.episode_type ?? ""}
                                            onChange={(e) =>
                                                episode(
                                                    i,
                                                    "episode_type",
                                                    e.target.value || null,
                                                )
                                            }
                                        >
                                            <option value="">Standard</option>
                                            {EPISODE_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {EPISODE_TYPE_LABELS[t]}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="tdx-label mb-0 col-span-2 sm:col-span-3">
                                        Summary{" "}
                                        <span className="tdx-label-hint">optional</span>
                                        <textarea
                                            maxLength={5000}
                                            rows={2}
                                            className="tdx-field mt-1 min-h-[44px] py-1.5 text-[12.5px]"
                                            value={ep.synopsis ?? ""}
                                            onChange={(e) =>
                                                episode(
                                                    i,
                                                    "synopsis",
                                                    e.target.value || null,
                                                )
                                            }
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="tdx-focus-ring self-end mb-2 text-[11.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded"
                                        onClick={() =>
                                            field(
                                                "episodes",
                                                payload.episodes.filter(
                                                    (_, j) => i !== j,
                                                ),
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                </fieldset>
                            ))}
                            <button
                                type="button"
                                className={buttonClasses({
                                    variant: "secondary",
                                    size: "sm",
                                    className: "self-start",
                                })}
                                onClick={() =>
                                    field("episodes", [
                                        ...payload.episodes,
                                        {
                                            episode_number:
                                                payload.episodes.length + 1,
                                            title: "",
                                        },
                                    ])
                                }
                            >
                                Add an episode
                            </button>
                        </div>
                    </section>
                )}
            </fieldset>

            {error && (
                <div role="alert" className="tdx-callout tdx-callout-warn">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-3 mt-1 flex-wrap">
                <button className={buttonClasses()} disabled={busy}>
                    {busy
                        ? "Submitting…"
                        : reviewId
                          ? "Approve and publish"
                          : correction
                            ? "Submit correction"
                            : "Submit title"}
                </button>
                {!correction && !reviewId && (
                    <button
                        type="button"
                        className={buttonClasses({ variant: "secondary" })}
                        disabled={busy}
                        onClick={checkDuplicates}
                    >
                        Check for existing titles
                    </button>
                )}
                {!reviewId && (
                    <span className="ml-auto text-[11.5px] text-[var(--text-muted)]">
                        {attemptsToday} of your {DAILY_LIMIT} submissions today
                    </span>
                )}
            </div>
            {!reviewId && (
                <p className="text-[11.5px] text-[var(--text-muted)] leading-[1.5]">
                    {correction
                        ? "You'll get a note on My submissions when an admin looks at it."
                        : "Poster art is assigned by an admin from approved storage after publication — no uploads needed from you. Trusted contributors publish straight through this same form."}
                </p>
            )}
        </form>
    );
}
