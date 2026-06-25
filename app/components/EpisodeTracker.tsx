"use client";

import { useState } from "react";

type EpisodeTrackerProps = {
    totalEpisodes: number;
    watchedEpisodes: number;
};

export default function EpisodeTracker({
    totalEpisodes,
    watchedEpisodes: initialWatched,
}: EpisodeTrackerProps) {
    const [watched, setWatched] = useState(initialWatched);

    function toggle(episodeNumber: number) {
        // Clicking a watched ep un-watches it and everything after;
        // clicking an unwatched ep marks up to that point as watched.
        setWatched((prev) => (prev >= episodeNumber ? episodeNumber - 1 : episodeNumber));
    }

    return (
        <div className="flex flex-wrap gap-2">
            {Array.from({ length: totalEpisodes }, (_, i) => {
                const ep = i + 1;
                const isWatched = ep <= watched;
                return (
                    <button
                        key={ep}
                        onClick={() => toggle(ep)}
                        className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${isWatched
                            ? "bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                        aria-label={`Episode ${ep}${isWatched ? " (watched)" : ""}`}
                    >
                        {ep}
                    </button>
                );
            })}
        </div>
    );
}
