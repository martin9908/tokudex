import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { buttonClasses } from "../atoms";
import { catalogHref, type AnyFilter } from "@/lib/catalog";

export const PAGE_SIZE = 24;

/** Filter pills + count + search, shared by the rankings and the community dex. */
export function CatalogToolbar({
    path,
    filters,
    filter,
    query,
    total,
    page,
    countLabel,
    trailing,
    search = true,
}: {
    path: string;
    filters: Record<string, string>;
    filter: AnyFilter;
    query: string;
    total: number;
    page: number;
    countLabel: string;
    trailing?: React.ReactNode;
    search?: boolean;
}) {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return (
        <div className="flex flex-wrap items-center gap-2.5 text-[12.5px]">
            <nav aria-label="Category" className="flex flex-wrap gap-2.5">
                {Object.entries(filters).map(([key, label]) => (
                    <Link
                        key={key}
                        href={catalogHref(path, key as AnyFilter, query, 1)}
                        aria-current={filter === key ? "page" : undefined}
                        className={`tdx-focus-ring px-3 py-[6px] rounded-[7px] border transition-colors ${
                            filter === key
                                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                : "border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
            <span className="text-[12px] text-[var(--text-secondary)]">
                {total.toLocaleString()} {countLabel}
                {pages > 1 ? ` · page ${page} of ${pages}` : ""}
            </span>
            <div className="ml-auto flex items-center gap-3">
                {trailing}
                {search && (
                    <form
                        action={path}
                        role="search"
                        className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 w-full sm:w-[220px] focus-within:border-[var(--accent-primary)] transition-colors"
                    >
                        <input type="hidden" name="filter" value={filter} />
                        <MagnifyingGlass
                            size={14}
                            className={
                                query
                                    ? "text-[var(--accent-primary)]"
                                    : "text-[var(--text-muted)]"
                            }
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
                )}
            </div>
        </div>
    );
}

export function Pagination({
    path,
    filter,
    query,
    page,
    total,
}: {
    path: string;
    filter: AnyFilter;
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

export function NoResults({ query, ranked }: { query: string; ranked: boolean }) {
    return (
        <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-center">
            <p className="text-sm font-medium">
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
