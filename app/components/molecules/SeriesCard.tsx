import Link from "next/link";
import Badge from "../atoms/Badge";
import ProgressBar from "../atoms/ProgressBar";
import PosterImage from "../atoms/PosterImage";
import MarkDoneButton from "./MarkDoneButton";

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
    const isComplete = totalEpisodes > 0 && watchedEpisodes >= totalEpisodes;
    const canComplete = totalEpisodes > 0 && !isComplete;

    return (
        <article className="group relative flex h-full flex-col gap-3 rounded-3xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 transition-colors hover:border-cyan-700/45 hover:bg-[#07182c]/80">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[170px] shrink-0 overflow-hidden rounded-2xl border border-cyan-900/40 bg-[#10141f]">
                <PosterImage
                    src={thumbnailUrl}
                    alt={title}
                    sizes="170px"
                    imageClassName="scale-[1.03] object-cover object-[50%_30%]"
                    iconClassName="h-16 w-16 opacity-75 transition-opacity group-hover:opacity-90"
                />
            </div>
            <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <Link
                        href={`/series/${id}`}
                        className="tdx-focus-ring line-clamp-1 font-semibold text-xl leading-tight tracking-tight text-cyan-50/95 after:absolute after:inset-0"
                    >
                        {title}
                    </Link>
                    {isComplete && (
                        <Badge variant="success" className="relative z-10 shrink-0">Complete</Badge>
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
                    {canComplete && (
                        <MarkDoneButton
                            seriesId={id}
                            totalEpisodes={totalEpisodes}
                            className="mt-3"
                        />
                    )}
                    {copyrightNotice && (
                        <p className="mt-3 text-[11px] text-cyan-200/45 line-clamp-1">
                            {copyrightNotice}
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}
