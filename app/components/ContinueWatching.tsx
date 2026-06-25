import Link from "next/link";
import { mvpProgress, mvpSeries } from "../../lib/mvp-data";

const watchItems = mvpProgress
    .map((progress) => {
        const series = mvpSeries.find((entry) => entry.id === progress.seriesId);
        if (!series) return null;
        return {
            id: series.id,
            title: series.title,
            episode: progress.currentEpisode,
            totalEpisodes: series.totalEpisodes,
            progress: Math.round((progress.currentEpisode / series.totalEpisodes) * 100),
            lastWatchedAt: progress.lastWatchedAt,
        };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
        (a, b) =>
            new Date(b.lastWatchedAt).getTime() -
            new Date(a.lastWatchedAt).getTime()
    );

export default function ContinueWatching() {
    if (watchItems.length === 0) {
        return (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No series in progress. Add one to get started.
            </p>
        );
    }

    return (
        <ul className="flex flex-col gap-3">
            {watchItems.map((item) => (
                <li key={item.id}>
                    <Link
                        href={`/series/${item.id}`}
                        className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.title}</span>
                            <span className="text-xs text-zinc-400">
                                Ep. {item.episode} / {item.totalEpisodes}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Last watched {new Date(item.lastWatchedAt).toLocaleDateString()}
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-50 transition-all"
                                style={{ width: `${item.progress}%` }}
                            />
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
