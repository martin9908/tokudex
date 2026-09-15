"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { saveEpisodeCheckIn } from "../actions";
import { NOTE_MAX_LENGTH } from "@/lib/validation";
import { buttonClasses } from "../components/atoms";
import StatusChoice, {
    type ProgressStatus,
} from "../components/molecules/StatusChoice";

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

type Progress = { status: ProgressStatus } | null;

function CheckInSkeleton() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
            <div className="tdx-skeleton h-3 w-40" />
            <div className="tdx-skeleton h-7 w-56 mt-4" />
            <div className="tdx-skeleton h-3 w-72 mt-3" />
            <div className="tdx-panel mt-5 p-4 h-[92px]" />
            <div className="tdx-panel mt-3.5 p-4 h-[150px]" />
        </div>
    );
}

function WatchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const seriesId = searchParams.get("series");
    const episodeParam = searchParams.get("episode");

    const [series, setSeries] = useState<Series | null>(null);
    const [episode, setEpisode] = useState<Episode | null>(null);
    const [note, setNote] = useState("");
    const [status, setStatus] = useState<ProgressStatus>("watching");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<"save" | "next" | null>(null);
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
                if (data.series.format === "movie") {
                    router.replace(`/series/${seriesId}`);
                    return;
                }
                setSeries(data.series);
                const existingNote = data.notes?.find(
                    (n: { episode_number: number; note: string }) =>
                        n.episode_number === episodeNumber,
                );
                setNote(existingNote?.note ?? "");
                const progress = data.progress as Progress;
                if (progress?.status && progress.status !== "plan_to_watch")
                    setStatus(progress.status);

                const foundEpisode = data.episodes.find(
                    (e: Episode) => e.episode_number === episodeNumber,
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
    }, [seriesId, episodeNumber, router]);

    const total = series?.total_episodes ?? null;
    const hasNext = total === null || episodeNumber < total;

    async function handleSave(mode: "save" | "next") {
        if (!seriesId || saving) return;

        try {
            setSaving(mode);
            setError(null);

            // Single atomic database transaction: progress + optional note.
            await saveEpisodeCheckIn(seriesId, episodeNumber, status, note);

            if (mode === "next" && hasNext) {
                router.push(
                    `/watch?series=${seriesId}&episode=${episodeNumber + 1}`,
                );
            } else {
                router.push(`/series/${seriesId}`);
            }
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "That check-in didn't save",
            );
            setSaving(null);
        }
    }

    if (loading) return <CheckInSkeleton />;

    if (!seriesId || !series) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
                <div className="tdx-callout tdx-callout-warn">
                    Series not found.
                </div>
                <Link
                    href="/series"
                    className="inline-block mt-4 text-sm text-[var(--accent-primary)]"
                >
                    ← Back to library
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 w-full">
            <Link
                href={`/series/${seriesId}`}
                className="tdx-focus-ring inline-flex items-center gap-2.5 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded"
            >
                <ArrowLeft size={16} aria-hidden />
                {series.title}
            </Link>
            <div className="flex items-baseline gap-2.5 mt-3">
                <h1 className="text-[26px] font-medium tracking-[-0.02em]">
                    Episode {episodeNumber}
                </h1>
                {total && (
                    <span className="text-[12.5px] text-[var(--text-muted)]">
                        of {total}
                    </span>
                )}
            </div>
            {episode?.title && (
                <p className="text-sm text-[var(--accent-text)] mt-1.5">
                    {episode.title}
                </p>
            )}
            {episode?.synopsis && (
                <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[var(--text-secondary)] max-w-[520px]">
                    {episode.synopsis}
                </p>
            )}

            {error && (
                <div className="tdx-callout tdx-callout-warn mt-4">{error}</div>
            )}

            <section className="tdx-panel mt-5 p-4">
                <p className="tdx-eyebrow">Series status</p>
                <div className="mt-2.5">
                    <StatusChoice
                        value={status}
                        onChange={setStatus}
                        disabled={saving !== null}
                    />
                </div>
            </section>

            <section className="tdx-panel mt-3.5 p-4">
                <div className="flex items-baseline gap-2">
                    <label htmlFor="recap-note" className="tdx-eyebrow">
                        Episode note
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)]">
                        private, optional
                    </span>
                </div>
                <textarea
                    id="recap-note"
                    rows={4}
                    value={note}
                    maxLength={NOTE_MAX_LENGTH}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What happened? A line or two is plenty."
                    className="tdx-field tdx-field-sunk mt-2 min-h-[84px] text-[13px] leading-[1.5]"
                />
                <div className="flex justify-between mt-1.5 text-[11px] text-[var(--text-muted)]">
                    <span>Only you can see this</span>
                    <span>
                        {note.length}/{NOTE_MAX_LENGTH}
                    </span>
                </div>
            </section>

            <div className="flex items-center gap-2.5 mt-[18px] flex-wrap">
                <button
                    type="button"
                    onClick={() => handleSave("save")}
                    disabled={saving !== null}
                    aria-busy={saving === "save"}
                    className={buttonClasses()}
                >
                    <CheckCircle size={15} weight="fill" aria-hidden />
                    {saving === "save" ? "Saving…" : "Save check-in"}
                </button>
                {hasNext && (
                    <button
                        type="button"
                        onClick={() => handleSave("next")}
                        disabled={saving !== null}
                        aria-busy={saving === "next"}
                        className={buttonClasses({ variant: "secondary" })}
                    >
                        {saving === "next"
                            ? "Saving…"
                            : `Save and log ${episodeNumber + 1}`}
                    </button>
                )}
                <Link
                    href={`/series/${seriesId}`}
                    className={buttonClasses({
                        variant: "ghost",
                        className: "ml-auto",
                    })}
                >
                    Cancel
                </Link>
            </div>
            <p className="mt-3 text-[11.5px] text-[var(--text-muted)] leading-[1.5]">
                Movies have no check-in screen — they go straight to watched on
                the detail page.
            </p>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={<CheckInSkeleton />}>
            <WatchPageContent />
        </Suspense>
    );
}
