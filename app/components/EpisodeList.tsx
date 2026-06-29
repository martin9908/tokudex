"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import EpisodeCheckInModal from "./EpisodeCheckInModal";
import { setEpisodeProgress } from "../actions";

type Episode = {
    episode_number: number;
    title: string | null;
};

type EpisodeListProps = {
    seriesId: string;
    seriesTitle: string;
    totalEpisodes: number;
    currentEpisode: number;
    episodes: Episode[];
};

export default function EpisodeList({
    seriesId,
    seriesTitle,
    totalEpisodes,
    currentEpisode,
    episodes,
}: EpisodeListProps) {
    const router = useRouter();
    const [openEpisode, setOpenEpisode] = useState<number | null>(null);
    const [pending, setPending] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    const nextRef = useRef<HTMLButtonElement>(null);

    function scrollToNext() {
        nextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Quick action: mark watched up to this episode, or unmark it (rewind to the
    // one before). Goes straight to the server — no recap modal.
    function quickMark(episodeNumber: number, watched: boolean) {
        const target = watched ? episodeNumber - 1 : episodeNumber;
        setPending(episodeNumber);
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, target);
                router.refresh();
            } catch {
                setError("Could not update progress. Please try again.");
            } finally {
                setPending(null);
            }
        });
    }

    // Index titles by episode number once, instead of a linear scan per row.
    const titlesByNumber = useMemo(() => {
        const map = new Map<number, string>();
        for (const entry of episodes) {
            if (entry.title) map.set(entry.episode_number, entry.title);
        }
        return map;
    }, [episodes]);

    return (
        <div>
            {error && (
                <p className="mb-3 rounded-lg border border-red-900/45 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </p>
            )}
            {totalEpisodes > 12 && currentEpisode < totalEpisodes && (
                <div className="mb-3 flex justify-end">
                    <button
                        type="button"
                        onClick={scrollToNext}
                        className="tdx-focus-ring rounded-lg border border-cyan-900/60 px-3 py-1.5 text-xs font-medium text-cyan-200/80 hover:bg-cyan-500/10 transition-colors"
                    >
                        Jump to Episode {currentEpisode + 1}
                    </button>
                </div>
            )}
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: totalEpisodes }, (_, index) => {
                    const episodeNumber = index + 1;
                    const isWatched = episodeNumber <= currentEpisode;
                    const isNext = episodeNumber === currentEpisode + 1;
                    const isPending = pending === episodeNumber;
                    const title = titlesByNumber.get(episodeNumber) ?? null;

                    return (
                        <li key={episodeNumber}>
                            <div
                                className={`rounded-xl border p-3 transition-colors ${isWatched
                                    ? "border-cyan-500/55 bg-cyan-500/15"
                                    : isNext
                                        ? "border-cyan-600/40 bg-[#0a2034]/80"
                                        : "border-cyan-900/45 bg-[#081a2b]/70"
                                    }`}
                            >
                                <button
                                    type="button"
                                    ref={isNext ? nextRef : undefined}
                                    onClick={() => setOpenEpisode(episodeNumber)}
                                    aria-label={`Log episode ${episodeNumber} with a recap`}
                                    className="tdx-focus-ring block w-full rounded-lg text-left"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-cyan-100/95">
                                            {isWatched && "✓ "}
                                            Episode {episodeNumber}
                                        </span>
                                        <span className="text-xs text-cyan-200/75">
                                            {isWatched ? "Watched" : isNext ? "Up next" : "Not logged"}
                                        </span>
                                    </div>
                                    {title && (
                                        <p className="text-xs text-cyan-100/80 mt-1 line-clamp-2">
                                            {title}
                                        </p>
                                    )}
                                    <p className="mt-2 text-[11px] text-cyan-300/80">Log with recap →</p>
                                </button>
                                <div className="mt-2 flex justify-end border-t border-cyan-900/40 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => quickMark(episodeNumber, isWatched)}
                                        disabled={isPending}
                                        className="tdx-focus-ring rounded-lg px-2 py-1 text-xs font-medium text-cyan-200/85 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
                                    >
                                        {isPending
                                            ? "Saving…"
                                            : isWatched
                                                ? "Unmark"
                                                : "✓ Mark watched"}
                                    </button>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            {openEpisode !== null && (
                <EpisodeCheckInModal
                    key={openEpisode}
                    open
                    seriesId={seriesId}
                    seriesTitle={seriesTitle}
                    episodeNumber={openEpisode}
                    episodeTitle={titlesByNumber.get(openEpisode) ?? null}
                    onClose={() => setOpenEpisode(null)}
                />
            )}
        </div>
    );
}
