import Link from "next/link";
import { FilmSlate } from "@phosphor-icons/react/ssr";
import { PosterImage, BigNumber, HairlineRule } from "../components/atoms";
import {
    CATALOG_FILTERS,
    type CatalogFilter,
    type CatalogItem,
} from "@/lib/catalog";
import {
    CatalogToolbar,
    Pagination,
    NoResults,
    PAGE_SIZE,
} from "../components/organisms/CatalogChrome";

type NearlyRanked = { series_id: string; title: string; vote_count: number };

/** Community rankings: weighted score, five votes to qualify. */
export default function RankingsTable({
    series,
    filter = "all",
    query = "",
    page = 1,
    total,
    nearly = [],
}: {
    series: CatalogItem[];
    filter?: CatalogFilter;
    query?: string;
    page?: number;
    total: number;
    nearly?: NearlyRanked[];
}) {
    const path = "/rankings";
    const cols = "grid-cols-[32px_1fr_64px_64px] sm:grid-cols-[44px_1fr_92px_92px_100px]";
    return (
        <div className="w-full px-4 sm:px-6 py-6 pb-24 flex flex-col gap-4">
            <div>
                <h1 className="text-[24px] tracking-[-0.02em]">Rankings</h1>
                <p className="text-[11.5px] text-[var(--text-muted)] mt-1 max-w-[640px] leading-[1.5]">
                    Weighted so a title with three perfect scores doesn&apos;t
                    outrank one with two hundred good ones. Five eligible votes
                    to appear; the displayed average is the plain member
                    average.
                </p>
            </div>
            <CatalogToolbar
                path={path}
                filters={CATALOG_FILTERS}
                filter={filter}
                query={query}
                total={total}
                page={page}
                countLabel="ranked"
            />
            {series.length === 0 ? (
                <NoResults query={query} ranked />
            ) : (
                <div className="flex flex-col">
                    <div
                        className={`grid ${cols} gap-3.5 px-3 pb-2 text-[10px] tracking-[0.1em] uppercase text-[var(--text-muted)] border-b border-[var(--line)]`}
                    >
                        <span>#</span>
                        <span>Title</span>
                        <span className="text-right">Score</span>
                        <span className="text-right">Average</span>
                        <span className="text-right hidden sm:block">Votes</span>
                    </div>
                    {series.map((s, index) => {
                        const rank = (page - 1) * PAGE_SIZE + index + 1;
                        const isMovie = s.format === "movie";
                        return (
                            <Link
                                key={s.id}
                                href={`/series/${s.id}`}
                                className={`tdx-row tdx-focus-ring grid ${cols} gap-3.5 items-center px-3 py-[11px]`}
                            >
                                <BigNumber
                                    size={22}
                                    tone={rank === 1 ? "accent" : "mute"}
                                >
                                    {rank}
                                </BigNumber>
                                <div className="flex items-center gap-3 min-w-0">
                                    {isMovie && !s.cover_image_url ? (
                                        <div className="w-[30px] h-10 rounded border border-[var(--accent-primary)] grid place-items-center text-[var(--accent-primary)] flex-none">
                                            <FilmSlate size={14} aria-hidden />
                                        </div>
                                    ) : (
                                        <div className="relative w-[30px] h-10 rounded overflow-hidden flex-none">
                                            <PosterImage
                                                src={s.cover_image_url}
                                                alt=""
                                                sizes="30px"
                                                pendingLabel=""
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[13.5px] font-medium truncate">
                                            {s.title}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                                            {[
                                                isMovie ? "Movie" : null,
                                                s.category !== "other"
                                                    ? s.category.replace(/^\w/, (c) => c.toUpperCase())
                                                    : null,
                                                s.franchise,
                                                s.release_year,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-right text-sm font-medium tabular-nums">
                                    {Number(s.weighted_score ?? s.average_score ?? 0).toFixed(2)}
                                </span>
                                <span className="text-right text-[12.5px] text-[var(--text-secondary)] tabular-nums">
                                    {Number(s.average_score ?? 0).toFixed(1)}
                                </span>
                                <span className="text-right text-[12.5px] text-[var(--text-secondary)] tabular-nums hidden sm:block">
                                    {s.vote_count ?? 0}
                                </span>
                            </Link>
                        );
                    })}
                    {nearly.length > 0 && (
                        <>
                            <HairlineRule className="my-2" inset={12} />
                            {nearly.map((n) => (
                                <Link
                                    key={n.series_id}
                                    href={`/series/${n.series_id}`}
                                    className={`tdx-row tdx-focus-ring grid ${cols} gap-3.5 items-center px-3 py-[11px] text-[var(--text-secondary)]`}
                                >
                                    <span className="text-[15px]">—</span>
                                    <div className="min-w-0">
                                        <p className="text-[13.5px] truncate">{n.title}</p>
                                        <p className="text-[11px] text-[var(--text-muted)]">
                                            Not ranked yet — {n.vote_count} of 5 votes
                                        </p>
                                    </div>
                                    <span className="text-right text-sm">—</span>
                                    <span className="text-right text-[12.5px]">—</span>
                                    <span className="text-right text-[12.5px] tabular-nums hidden sm:block">
                                        {n.vote_count}
                                    </span>
                                </Link>
                            ))}
                        </>
                    )}
                </div>
            )}
            <Pagination
                path={path}
                filter={filter}
                query={query}
                page={page}
                total={total}
            />
        </div>
    );
}
