"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitTitle, findDuplicates, reviewSubmission } from "./actions";
import {
    validateCatalogPayload,
    type CatalogPayload,
    type CatalogEpisode,
} from "@/lib/catalog";
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
export default function SubmissionForm({
    initial = empty,
    initialSources = [],
    seriesId,
    revision,
    reviewId,
}: {
    initial?: CatalogPayload;
    initialSources?: string[];
    seriesId?: string;
    revision?: number;
    reviewId?: string;
}) {
    const [payload, setPayload] = useState(initial);
    const [sources, setSources] = useState(initialSources.join("\n"));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [duplicates, setDuplicates] = useState<Awaited<
        ReturnType<typeof findDuplicates>
    > | null>(null);
    const router = useRouter();
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
    return (
        <form
            className="tdx-panel p-5 space-y-5"
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
                    router.push(reviewId ? "/admin" : "/community");
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
            <p>
                Write your own summary and link reliable sources. Regular
                submissions need review; active trusted contributors publish
                directly. Limit: ten submission attempts per day.
            </p>
            <fieldset disabled={busy} className="space-y-4">
                <label className="block">
                    Title
                    <input
                        className="tdx-field p-3 mt-1"
                        required
                        maxLength={300}
                        value={payload.title}
                        onChange={(e) => {
                            field("title", e.target.value);
                            setDuplicates(null);
                        }}
                    />
                </label>
                <button
                    type="button"
                    className="tdx-focus-ring underline"
                    onClick={async () => {
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
                            setError(
                                e instanceof Error
                                    ? e.message
                                    : "Search failed",
                            );
                        }
                    }}
                >
                    Check for existing titles
                </button>
                {duplicates && (
                    <div
                        role="status"
                        className="border border-cyan-800 rounded-lg p-3"
                    >
                        {duplicates.filter((s) => s.id !== seriesId).length ===
                        0
                            ? "No similar titles found."
                            : duplicates
                                  .filter((s) => s.id !== seriesId)
                                  .map((s) => (
                                      <p key={s.id}>
                                          <Link
                                              href={`/series/${s.id}`}
                                              target="_blank"
                                              className="underline"
                                          >
                                              {s.title}
                                          </Link>{" "}
                                          · {s.category} · {s.format} ·{" "}
                                          {s.release_year ?? "Year unknown"}
                                      </p>
                                  ))}
                    </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                    <label>
                        Category
                        <select
                            disabled={!!seriesId}
                            className="tdx-field p-3 mt-1"
                            value={payload.category}
                            onChange={(e) =>
                                field(
                                    "category",
                                    e.target
                                        .value as CatalogPayload["category"],
                                )
                            }
                        >
                            <option value="tokusatsu">Tokusatsu</option>
                            <option value="anime">Anime</option>
                            <option value="other">Other (movies only)</option>
                        </select>
                    </label>
                    <label>
                        Format
                        <select
                            disabled={!!seriesId}
                            className="tdx-field p-3 mt-1"
                            value={payload.format}
                            onChange={(e) =>
                                field(
                                    "format",
                                    e.target.value as CatalogPayload["format"],
                                )
                            }
                        >
                            <option value="series">
                                Series / anime season
                            </option>
                            <option value="movie">Movie</option>
                        </select>
                    </label>
                </div>
                <p className="text-sm text-cyan-200/70">
                    Use a separate title for each anime season or distinct run.
                    Related seasons can share a franchise.
                </p>
                <label className="block">
                    Franchise
                    <input
                        className="tdx-field p-3 mt-1"
                        maxLength={200}
                        value={payload.franchise ?? ""}
                        onChange={(e) =>
                            field("franchise", e.target.value || null)
                        }
                    />
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                    <label>
                        Release year
                        <input
                            type="number"
                            min={1800}
                            max={2200}
                            className="tdx-field p-3 mt-1"
                            value={payload.release_year ?? ""}
                            onChange={(e) =>
                                field(
                                    "release_year",
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                        />
                    </label>
                    {payload.format === "movie" ? (
                        <label>
                            Runtime (minutes)
                            <input
                                type="number"
                                min={1}
                                max={10000}
                                className="tdx-field p-3 mt-1"
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
                        </label>
                    ) : (
                        <label>
                            Total episodes (leave blank if unknown)
                            <input
                                type="number"
                                min={1}
                                max={100000}
                                className="tdx-field p-3 mt-1"
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
                        </label>
                    )}
                </div>
                <label className="block">
                    Synopsis
                    <textarea
                        className="tdx-field p-3 mt-1"
                        rows={4}
                        maxLength={5000}
                        value={payload.synopsis ?? ""}
                        onChange={(e) =>
                            field("synopsis", e.target.value || null)
                        }
                    />
                </label>
                <label className="block">
                    HTTPS source links (one per line)
                    <textarea
                        required
                        className="tdx-field p-3 mt-1"
                        rows={3}
                        value={sources}
                        onChange={(e) => setSources(e.target.value)}
                    />
                </label>
                {payload.format === "series" && (
                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold">
                            Episode additions / corrections
                        </h2>
                        <p>
                            Only include episodes you want to add or change.
                            Existing episodes are otherwise preserved.
                        </p>
                        {payload.episodes.map((ep, i) => (
                            <fieldset
                                className="border border-cyan-800 rounded-lg p-3 space-y-2"
                                key={i}
                            >
                                <legend>Episode {i + 1}</legend>
                                <label className="block">
                                    Number
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        className="tdx-field p-2"
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
                                <label className="block">
                                    Episode title
                                    <input
                                        required
                                        maxLength={300}
                                        className="tdx-field p-2"
                                        value={ep.title}
                                        onChange={(e) =>
                                            episode(i, "title", e.target.value)
                                        }
                                    />
                                </label>
                                <label className="block">
                                    Episode summary
                                    <textarea
                                        maxLength={5000}
                                        className="tdx-field p-2"
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
                                <label className="block">
                                    Air date
                                    <input
                                        type="date"
                                        className="tdx-field p-2"
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
                                <label className="block">
                                    Episode type
                                    <select
                                        className="tdx-field p-2"
                                        value={ep.episode_type ?? ""}
                                        onChange={(e) =>
                                            episode(
                                                i,
                                                "episode_type",
                                                e.target.value || null,
                                            )
                                        }
                                    >
                                        <option value="">Regular</option>
                                        {[
                                            "filler",
                                            "clip_show",
                                            "recap",
                                            "special",
                                            "crossover",
                                        ].map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    className="underline"
                                    onClick={() =>
                                        field(
                                            "episodes",
                                            payload.episodes.filter(
                                                (_, j) => i !== j,
                                            ),
                                        )
                                    }
                                >
                                    Remove from submission
                                </button>
                            </fieldset>
                        ))}
                        <button
                            type="button"
                            className="tdx-focus-ring underline"
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
                            Add episode
                        </button>
                    </section>
                )}
                <button className="tdx-focus-ring bg-cyan-400 text-slate-950 rounded-lg px-5 py-3">
                    {busy
                        ? "Submitting…"
                        : reviewId
                          ? "Approve and publish"
                          : "Submit title"}
                </button>
            </fieldset>
            <p role="alert">{error}</p>
        </form>
    );
}
