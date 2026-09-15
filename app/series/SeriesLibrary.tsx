import Link from "next/link";
import { MagnifyingGlass, FilmSlate, Plus } from "@phosphor-icons/react/ssr";
import { PosterImage, ProgressBar, buttonClasses } from "../components/atoms";
import {
    CATALOG_FILTERS,
    catalogHref,
    type CatalogFilter,
    type CatalogItem,
} from "@/lib/catalog";

export type Series = CatalogItem;

/** The caller's page-scoped progress: current episode and status per title. */
export type LibraryProgress = Record<
    string,
    { current: number; status: string }
>;

const PAGE_SIZE = 24;

const STATUS_BADGE: Record<string, { label: string; accent: boolean }> = {
    watching: { label: "Watching", accent: true },
    completed: { label: "Completed", accent: true },
    on_hold: { label: "On hold", accent: false },
    plan_to_watch: { label: "Planned", accent: false },
};

function CatalogToolbar({
    path,
    filter,
    query,
    total,
    page,
    countLabel,
}: {
    path: string;
    filter: CatalogFilter;
    query: string;
    total: number;
    page: number;
    countLabel: string;
}) {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return (
        <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Category" className="tdx-seg">
                {Object.entries(CATALOG_FILTERS).map(([key, label]) => (
                    <Link
                        key={key}
                        href={catalogHref(path, key as CatalogFilter, query, 1)}
                        aria-current={filter === key ? "page" : undefined}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
            <span className="text-xs text-[var(--text-muted)]">
                {total} {countLabel} · page {page} of {pages}
            </span>
            <form
                action={path}
                role="search"
                className="ml-auto flex lg:hidden items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 w-full sm:w-[230px] focus-within:border-[var(--accent-primary)] transition-colors"
            >
                <input type="hidden" name="filter" value={filter} />
                <MagnifyingGlass
                    size={14}
                    className={query ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}
                    aria-hidden
                />
                <input
                    className="flex-1 min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--text-muted)]"
                    name="q"
                    type="search"
                    defaultValue={query}
                    maxLength={200}
                    placeholder="Search catalog"
                    aria-label="Search catalog"
                />
            </form>
        </div>
    );
}

function Pagination({
    path,
    filter,
    query,
    page,
    total,
}: {
    path: string;
    filter: CatalogFilter;
    query: string;
    page: number;
    total: number;
}) {
    const hasPrev = page > 1;
    const hasNext = page * PAGE_SIZE < total;
    if (!hasPrev && !hasNext) return null;
    return (
        <nav
            aria-label="Pagination"
            className="flex gap-6 text-[var(--accent-primary)] text-xs"
        >
            {hasPrev && (
                <Link href={catalogHref(path, filter, query, page - 1)}>
                    ← Previous
                </Link>
            )}
            {hasNext && (
                <Link href={catalogHref(path, filter, query, page + 1)}>
                    Next →
                </Link>
            )}
        </nav>
    );
}

function NoResults({ query, ranked }: { query: string; ranked: boolean }) {
    return (
        <div className="tdx-panel p-6 text-center">
            <MagnifyingGlass
                size={26}
                className="mx-auto text-[var(--text-muted)]"
                aria-hidden
            />
            <p className="text-sm font-medium mt-2.5">
                {ranked
                    ? "No titles qualify yet"
                    : query
                      ? `No titles match “${query}”`
                      : "No titles here yet"}
            </p>
            <p className="text-[12.5px] text-[var(--text-secondary)] mt-1.5 leading-[1.5]">
                {ranked
                    ? "Titles need five ratings to rank. Start tracking and add a rating."
                    : "Missing from the catalog? Add it and an admin will check it over."}
            </p>
            {!ranked && (
                <Link
                    href="/community/new"
                    className={buttonClasses({ className: "mt-3.5" })}
                >
                    Add a title
                </Link>
            )}
        </div>
    );
}

/** Poster tile for the library grid — no card chrome, just art and a line. */
function TitleTile({
    s,
    progress,
}: {
    s: CatalogItem;
    progress?: { current: number; status: string };
}) {
    const isMovie = s.format === "movie";
    const badge = progress && !isMovie ? STATUS_BADGE[progress.status] : null;
    const muted = progress?.status === "on_hold";
    const line = (() => {
        if (progress && isMovie)
            return progress.current === 1
                ? `Watched${s.release_year ? ` · ${s.release_year}` : ""}`
                : `Plan to watch${s.release_year ? ` · ${s.release_year}` : ""}`;
        if (progress && s.total_episodes)
            return `${progress.current} / ${s.total_episodes}${s.release_year ? ` · ${s.release_year}` : ""}`;
        if (isMovie)
            return [
                s.runtime_minutes ? `${s.runtime_minutes} min` : "Movie",
                s.release_year,
            ]
                .filter(Boolean)
                .join(" · ");
        return [
            s.total_episodes ? `${s.total_episodes} episodes` : "Episodes TBA",
            s.release_year,
        ]
            .filter(Boolean)
            .join(" · ");
    })();
    const movieWatched = isMovie && progress?.current === 1;

    return (
        <Link
            href={`/series/${s.id}`}
            className="tdx-focus-ring group flex flex-col gap-2 rounded-md"
        >
            <div className="relative">
                {isMovie && !s.cover_image_url ? (
                    <div
                        className={`aspect-[3/4] rounded-md border bg-[var(--surface)] flex flex-col items-center justify-center gap-2 ${
                            movieWatched
                                ? "border-[var(--accent-primary)] border-l-[3px] text-[var(--accent-primary)]"
                                : "border-[var(--line)] text-[var(--text-muted)]"
                        } group-hover:border-[var(--accent-primary)] transition-colors`}
                    >
                        <FilmSlate size={30} aria-hidden />
                        <span className="text-[10px] tracking-[0.12em] uppercase">
                            Movie
                        </span>
                    </div>
                ) : (
                    <div className="relative aspect-[3/4] rounded-md overflow-hidden border border-[var(--line)] group-hover:border-[var(--accent-primary)] transition-colors">
                        <PosterImage
                            src={s.cover_image_url}
                            alt={s.title}
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 180px"
                        />
                    </div>
                )}
                {badge && (
                    <span
                        className={`absolute top-[7px] left-[7px] text-[9.5px] tracking-[0.06em] uppercase px-[7px] py-[3px] rounded-[5px] ${
                            badge.accent
                                ? "bg-[var(--accent-primary)] text-[var(--surface)]"
                                : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--line)]"
                        }`}
                    >
                        {badge.label}
                    </span>
                )}
            </div>
            <p
                className={`text-[12.5px] font-medium leading-[1.25] ${
                    !s.cover_image_url && !isMovie
                        ? "text-[var(--text-secondary)]"
                        : ""
                }`}
            >
                {s.title}
            </p>
            {!isMovie && (
                <ProgressBar
                    value={progress?.current ?? 0}
                    max={s.total_episodes ?? 0}
                    size="xs"
                    muted={muted}
                    label={
                        progress
                            ? `${progress.current} of ${s.total_episodes ?? "?"} watched`
                            : "Not tracked"
                    }
                />
            )}
            <p
                className={`text-[11px] ${movieWatched ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}`}
            >
                {line}
            </p>
        </Link>
    );
}

export default function SeriesLibrary({
    series,
    progress = {},
    filter = "all",
    query = "",
    page = 1,
    total,
    signedIn = false,
}: {
    series: CatalogItem[];
    progress?: LibraryProgress;
    filter?: CatalogFilter;
    query?: string;
    page?: number;
    total: number;
    signedIn?: boolean;
}) {
    const path = "/series";
    const tracked = series.filter((s) => s.id in progress).length;
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-[24px] tracking-[-0.02em]">Library</h1>
                    <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                        Tokusatsu, anime, and movies
                        {signedIn && tracked > 0
                            ? ` · ${tracked} on this page in your tracker`
                            : ""}
                    </p>
                </div>
                <Link
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                    href="/community/new"
                >
                    <Plus size={13} aria-hidden />
                    Add a title
                </Link>
            </div>
            <CatalogToolbar
                path={path}
                filter={filter}
                query={query}
                total={total}
                page={page}
                countLabel={total === 1 ? "title" : "titles"}
            />
            {series.length === 0 ? (
                <NoResults query={query} ranked={false} />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {series.map((s) => (
                        <TitleTile key={s.id} s={s} progress={progress[s.id]} />
                    ))}
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

/** Community rankings: weighted score, five votes to qualify. */
export function RankingsTable({
    series,
    filter = "all",
    query = "",
    page = 1,
    total,
}: {
    series: CatalogItem[];
    filter?: CatalogFilter;
    query?: string;
    page?: number;
    total: number;
}) {
    const path = "/rankings";
    const cols = "grid-cols-[32px_1fr_64px_64px] sm:grid-cols-[44px_1fr_92px_92px_100px]";
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 flex flex-col gap-4">
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
                                <span
                                    className={`text-[15px] font-medium ${rank === 1 ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}`}
                                >
                                    {rank}
                                </span>
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
