"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { saveEpisodeCheckIn } from "../actions";
import type { ProgressStatus } from "@/lib/validation";
import CheckInForm from "../components/organisms/CheckInForm";

type Series = {
    id: string;
    title: string;
    total_episodes: number | null;
};

type Episode = {
    episode_number: number;
    title: string;
    synopsis: string | null;
    episode_type?: string | null;
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
                await saveEpisodeCheckIn(seriesId, episodeNumber + 1, status, "");
                router.push(`/series/${seriesId}`);
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
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 w-full">
            <Link
                href={`/series/${seriesId}`}
                className="tdx-focus-ring inline-flex items-center gap-2.5 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded"
            >
                <ArrowLeft size={16} aria-hidden />
                Back to {series.title}
            </Link>
            <div className="mt-5 rounded-lg border border-[var(--line)] px-[22px] sm:px-[28px] pt-[22px] pb-[26px]">
                <CheckInForm
                    seriesTitle={series.title}
                    episodeNumber={episodeNumber}
                    totalEpisodes={total}
                    episodeTitle={episode?.title}
                    episodeSynopsis={episode?.synopsis}
                    episodeType={episode?.episode_type}
                    note={note}
                    onNoteChange={setNote}
                    status={status}
                    onStatusChange={setStatus}
                    saving={saving !== null}
                    error={error}
                    onSave={(alsoNext) => handleSave(alsoNext ? "next" : "save")}
                />
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
