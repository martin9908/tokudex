"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

type Series = {
    id: string;
    title: string;
    total_episodes: number | null;
};

type Episode = {
    episode_number: number;
    title: string;
    synopsis: string | null;
};

function WatchPageContent() {
    const searchParams = useSearchParams();
    const seriesId = searchParams.get("series");
    const episodeParam = searchParams.get("episode");

    const [series, setSeries] = useState<Series | null>(null);
    const [episode, setEpisode] = useState<Episode | null>(null);
    const [note, setNote] = useState("");
    const [status, setStatus] = useState<
        "watching" | "completed" | "on_hold" | "plan_to_watch"
    >("watching");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const episodeNumber = episodeParam ? parseInt(episodeParam, 10) : 1;

    useEffect(() => {
        async function fetchData() {
            if (!seriesId) {
                setError("Series ID is required");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/series/${seriesId}`);
                if (!res.ok) throw new Error("Failed to fetch series");

                const data = await res.json();
                setSeries(data.series);

                const foundEpisode = data.episodes.find(
                    (e: Episode) => e.episode_number === episodeNumber
                );
                setEpisode(foundEpisode || null);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [seriesId, episodeNumber]);

    async function handleSave() {
        if (!seriesId) return;

        try {
            setSaving(true);
            setError(null);

            // Save progress
            const progressRes = await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    seriesId,
                    currentEpisode: episodeNumber,
                    status,
                }),
            });

            if (!progressRes.ok) throw new Error("Failed to save progress");

            // Save note if provided
            if (note.trim()) {
                const noteRes = await fetch("/api/notes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        seriesId,
                        episodeNumber,
                        note,
                    }),
                });

                if (!noteRes.ok) throw new Error("Failed to save note");
            }

            // Redirect to series detail
            window.location.href = `/series/${seriesId}`;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 w-full">
                <p className="text-cyan-200/70">Loading episode...</p>
            </div>
        );
    }

    if (!seriesId || !series) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 w-full">
                <p className="text-red-400/90 mb-4">Series not found</p>
                <Link href="/series" className="text-cyan-300 hover:text-cyan-200">
                    Back to Series
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10 w-full space-y-4">
            <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70 mb-2">
                    Episode Check-in
                </p>
                <h1 className="text-3xl font-bold mb-1">{series.title}</h1>
                <p className="text-cyan-100/75">Episode {episodeNumber}</p>
                {episode && (
                    <p className="text-sm text-cyan-200/70 mt-2">{episode.title}</p>
                )}
            </section>

            {error && (
                <section className="rounded-2xl border border-red-900/45 bg-red-500/10 p-4">
                    <p className="text-sm text-red-300">{error}</p>
                </section>
            )}

            <section className="rounded-2xl border border-cyan-900/45 bg-[#061321]/75 p-5 space-y-4">
                <div>
                    <label className="text-sm font-medium text-cyan-100/90 block mb-2">
                        Quick recap note
                    </label>
                    <textarea
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What happened in this episode?"
                        className="w-full rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/40 outline-none focus:ring-2 focus:ring-cyan-500/60"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-cyan-100/90 block mb-2">Status</label>
                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(
                                e.target.value as
                                | "watching"
                                | "completed"
                                | "on_hold"
                                | "plan_to_watch"
                            )
                        }
                        className="w-full rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-2.5 text-sm text-cyan-50 outline-none focus:ring-2 focus:ring-cyan-500/60"
                    >
                        <option value="watching">Watching</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="plan_to_watch">Plan to Watch</option>
                    </select>
                </div>
            </section>

            <div className="flex flex-wrap gap-3">
                <Link
                    href={`/series/${seriesId}`}
                    className="flex-1 min-w-[170px] rounded-lg border border-cyan-900/60 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-500/10 transition-colors text-center"
                >
                    Back to Series
                </Link>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 min-w-[170px] rounded-lg bg-cyan-500/90 text-[#031018] px-4 py-2.5 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                >
                    {saving ? "Saving..." : "Save and Mark Watched"}
                </button>
            </div>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-3xl mx-auto px-4 py-8 w-full">
                    <p className="text-cyan-200/70">Loading episode...</p>
                </div>
            }
        >
            <WatchPageContent />
        </Suspense>
    );
}
