import Link from "next/link";
import Image from "next/image";
import tokudexIcon from "../../assets/tokudex_icon.png";

type SeriesCardProps = {
    id: string;
    title: string;
    totalEpisodes: number;
    watchedEpisodes: number;
    franchise?: string;
    synopsis?: string;
    thumbnailUrl?: string | null;
    copyrightNotice?: string | null;
};

export default function SeriesCard({
    id,
    title,
    totalEpisodes,
    watchedEpisodes,
    franchise,
    synopsis,
    thumbnailUrl,
    copyrightNotice,
}: SeriesCardProps) {
    const progress = Math.round((watchedEpisodes / Math.max(totalEpisodes, 1)) * 100);
    const isComplete = watchedEpisodes === totalEpisodes;

    return (
        <Link
            href={`/series/${id}`}
            className="group flex h-full flex-col gap-3 rounded-3xl border border-cyan-900/45 bg-[#041024]/82 p-4 hover:border-cyan-700/45 hover:bg-[#07182c]/88 transition-colors"
        >
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[170px] shrink-0 overflow-hidden rounded-2xl border border-cyan-900/40 bg-[#10141f]">
                {thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="absolute inset-0 block h-full w-full scale-[1.03] object-cover object-[50%_30%]"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Image
                            src={tokudexIcon}
                            alt={title}
                            className="h-16 w-16 opacity-75 transition-opacity group-hover:opacity-90"
                        />
                    </div>
                )}
            </div>
            <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="line-clamp-1 font-semibold text-xl leading-tight tracking-tight text-cyan-50/95">
                        {title}
                    </span>
                    {isComplete && (
                        <span className="text-xs font-medium text-emerald-300 shrink-0">
                            Complete
                        </span>
                    )}
                </div>
                <p className="text-sm text-cyan-100/85 mb-2">
                    {watchedEpisodes} / {totalEpisodes} episodes
                </p>
                {franchise && (
                    <p className="text-xs text-cyan-200/75 mb-2">{franchise}</p>
                )}
                {synopsis && (
                    <p className="text-xs text-cyan-100/62 line-clamp-2 mb-3 leading-snug">
                        {synopsis}
                    </p>
                )}
                <div className="h-2 w-full rounded-full bg-cyan-950/75 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-cyan-300 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {copyrightNotice && (
                    <p className="mt-3 text-[11px] text-zinc-400/80 line-clamp-1">
                        {copyrightNotice}
                    </p>
                )}
            </div>
        </Link>
    );
}
