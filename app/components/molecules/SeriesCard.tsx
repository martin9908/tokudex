import Link from "next/link";
import Image from "next/image";
import tokudexIcon from "../../../assets/tokudex_icon.png";
import Badge from "../atoms/Badge";
import ProgressBar from "../atoms/ProgressBar";

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
    const isComplete = watchedEpisodes === totalEpisodes;

    return (
        <Link
            href={`/series/${id}`}
            className="tdx-focus-ring group flex h-full flex-col gap-3 rounded-3xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 hover:border-cyan-700/45 hover:bg-[#07182c]/80 transition-colors"
        >
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[170px] shrink-0 overflow-hidden rounded-2xl border border-cyan-900/40 bg-[#10141f]">
                {thumbnailUrl ? (
                    <Image
                        src={thumbnailUrl}
                        alt={title}
                        fill
                        sizes="170px"
                        className="scale-[1.03] object-cover object-[50%_30%]"
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
            <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="line-clamp-1 font-semibold text-xl leading-tight tracking-tight text-cyan-50/95">
                        {title}
                    </span>
                    {isComplete && (
                        <Badge variant="success" className="shrink-0">Complete</Badge>
                    )}
                </div>
                <p className="text-sm text-cyan-100/85 mb-2">
                    {watchedEpisodes} / {totalEpisodes} episodes
                </p>
                {franchise && (
                    <p className="text-xs text-cyan-200/75 mb-2">{franchise}</p>
                )}
                {synopsis && (
                    <p className="text-xs text-cyan-100/75 line-clamp-2 mb-3 leading-snug">
                        {synopsis}
                    </p>
                )}
                <div className="mt-auto pt-2">
                    <ProgressBar
                        value={watchedEpisodes}
                        max={Math.max(totalEpisodes, 1)}
                        label={`${watchedEpisodes} of ${totalEpisodes} episodes watched`}
                    />
                    {copyrightNotice && (
                        <p className="mt-3 text-[11px] text-cyan-200/45 line-clamp-1">
                            {copyrightNotice}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
