"use client";

import { useState, useTransition } from "react";
import { setEpisodeProgress } from "../actions";

type Episode = {
    episode_number: number;
    title: string | null;
};

type EpisodeListProps = {
    seriesId: string;
    totalEpisodes: number;
    currentEpisode: number;
    episodes: Episode[];
};

export default function EpisodeList({
    seriesId,
    totalEpisodes,
    currentEpisode,
    episodes,
}: EpisodeListProps) {
    const [current, setCurrent] = useState(currentEpisode);
    const [pending, setPending] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    function handleToggle(episodeNumber: number) {
        // Clicking a watched episode rewinds to just before it; clicking an
        // unwatched episode marks everything up to it as watched.
        const next = episodeNumber <= current ? episodeNumber - 1 : episodeNumber;
        const previous = current;

        setCurrent(next); // optimistic
        setPending(episodeNumber);
        setError(null);

        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, next);
            } catch {
                setCurrent(previous); // revert on failure
                setError("Could not save progress. Please try again.");
            } finally {
                setPending(null);
            }
        });
    }

    const episodeTitle = (n: number) =>
        episodes.find((entry) => entry.episode_number === n)?.title ?? null;

    return (
        <div>
            {error && (
                <p className="mb-3 rounded-lg border border-red-900/45 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </p>
            )}
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: totalEpisodes }, (_, index) => {
                    const episodeNumber = index + 1;
                    const isWatched = episodeNumber <= current;
                    const isNext = episodeNumber === current + 1;
                    const isPending = pending === episodeNumber;
                    const title = episodeTitle(episodeNumber);

                    return (
                        <li key={episodeNumber}>
                            <button
                                type="button"
                                onClick={() => handleToggle(episodeNumber)}
                                disabled={isPending}
                                aria-pressed={isWatched}
                                className={`w-full text-left rounded-xl border p-3 transition-colors disabled:opacity-60 ${
                                    isWatched
                                        ? "border-cyan-500/55 bg-cyan-500/15 hover:bg-cyan-500/20"
                                        : isNext
                                          ? "border-cyan-600/40 bg-[#0a2034]/80 hover:border-cyan-500/50"
                                          : "border-cyan-900/45 bg-[#081a2b]/70 hover:border-cyan-700/45"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-cyan-100/95">
                                        {isWatched && "✓ "}
                                        {isNext && "▶ "}
                                        Episode {episodeNumber}
                                    </span>
                                    <span className="text-xs text-cyan-200/75">
                                        {isPending
                                            ? "Saving…"
                                            : isWatched
                                              ? "Watched"
                                              : isNext
                                                ? "Up next"
                                                : ""}
                                    </span>
                                </div>
                                {title && (
                                    <p className="text-xs text-cyan-100/65 mt-1 line-clamp-2">
                                        {title}
                                    </p>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
