import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { PosterImage, ProgressBar, buttonClasses } from "../components/atoms";
import {
    CATALOG_FILTERS,
    catalogHref,
    type CatalogFilter,
    type CatalogItem,
} from "@/lib/catalog";
export type Series = CatalogItem;
export default function SeriesLibrary({
    series,
    progress = {},
    filter = "all",
    query = "",
    page = 1,
    total,
    ranked = false,
}: {
    series: CatalogItem[];
    progress?: Record<string, number>;
    filter?: CatalogFilter;
    query?: string;
    page?: number;
    total: number;
    ranked?: boolean;
}) {
    const path = ranked ? "/rankings" : "/series";
    return (
        <div className="max-w-6xl mx-auto px-4 py-6 pb-24 space-y-5">
            <div className="flex flex-wrap justify-between gap-3">
                <div>
                    <h1 className="text-3xl">
                        {ranked ? "Community Rankings" : "Library"}
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Tokusatsu, anime, and movies — find your next title.
                    </p>
                </div>
                <Link
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                    href="/community/new"
                >
                    Add a title
                </Link>
            </div>
            {ranked && (
                <p className="tdx-panel p-4 text-sm text-[var(--text-secondary)]">
                    Titles need five ratings to rank. Ordering balances each
                    average with ten votes at the category average, so small
                    samples have less influence. The displayed score is the
                    plain member average.
                </p>
            )}
            <div className="tdx-panel p-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-lg border border-[var(--line)] overflow-hidden text-[13px] flex-none">
                    {Object.entries(CATALOG_FILTERS).map(([key, label], i) => (
                        <Link
                            key={key}
                            href={catalogHref(path, key as CatalogFilter, query, 1)}
                            className={`px-3.5 py-1.5 ${i > 0 ? "border-l border-[var(--line)]" : ""} ${
                                filter === key
                                    ? "bg-[var(--accent-tint)] text-[var(--accent-on)]"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
                <form
                    action={path}
                    className="flex-1 min-w-48 flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 focus-within:border-[var(--accent-primary)]"
                >
                    <input type="hidden" name="filter" value={filter} />
                    <MagnifyingGlass
                        size={15}
                        className="text-[var(--text-muted)] flex-none"
                    />
                    <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                        name="q"
                        defaultValue={query}
                        maxLength={200}
                        placeholder="Search titles and descriptions"
                    />
                </form>
                <span className="text-[12px] text-[var(--text-muted)] flex-none">
                    {total} {total === 1 ? "title" : "titles"} · page {page} of{" "}
                    {Math.max(1, Math.ceil(total / 24))}
                </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {series.map((s, index) => (
                    <Link
                        key={s.id}
                        href={`/series/${s.id}`}
                        className="tdx-focus-ring tdx-panel p-3 flex flex-col gap-2 hover:border-[var(--accent-primary)] transition-colors"
                    >
                        <div className="relative aspect-[3/4] rounded-md overflow-hidden">
                            <PosterImage
                                src={s.cover_image_url}
                                alt={s.title}
                                sizes="(max-width: 768px) 45vw, 230px"
                            />
                        </div>
                        <h2 className="text-[13px] font-medium leading-tight">
                            {ranked ? `${(page - 1) * 24 + index + 1}. ` : ""}
                            {s.title}
                        </h2>
                        {!ranked &&
                            s.id in progress &&
                            s.format === "series" &&
                            s.total_episodes && (
                                <ProgressBar
                                    value={progress[s.id]}
                                    max={s.total_episodes}
                                    size="sm"
                                    label="Watch progress"
                                />
                            )}
                        <p className="text-[11px] text-[var(--text-secondary)] capitalize">
                            {!ranked && s.id in progress
                                ? s.format === "movie"
                                    ? progress[s.id] === 1
                                        ? "Watched"
                                        : "Plan to watch"
                                    : `Episode ${progress[s.id]} of ${s.total_episodes ?? "?"}`
                                : `${s.category === "other" ? "" : `${s.category} · `}${s.format === "movie" ? "Movie" : "Series"}${s.release_year ? ` · ${s.release_year}` : ""}`}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                            {s.vote_count
                                ? `${Number(s.average_score).toFixed(1)}/10 · ${s.vote_count} ${Number(s.vote_count) === 1 ? "rating" : "ratings"}`
                                : "Not yet rated"}
                        </p>
                    </Link>
                ))}
            </div>
            {series.length === 0 && (
                <p className="tdx-panel p-6 text-[var(--text-secondary)]">
                    {ranked
                        ? "No titles qualify yet. Start tracking and add a rating."
                        : "No titles found. Try another search or contribute a missing title."}
                </p>
            )}
            <nav aria-label="Pagination" className="flex gap-6 text-[var(--accent-primary)] text-sm">
                {page > 1 && (
                    <Link href={catalogHref(path, filter, query, page - 1)}>
                        ← Previous
                    </Link>
                )}
                {page * 24 < total && (
                    <Link href={catalogHref(path, filter, query, page + 1)}>
                        Next →
                    </Link>
                )}
            </nav>
            <Link href="/community" className="block text-sm text-[var(--accent-primary)]">
                My submissions
            </Link>
        </div>
    );
}
