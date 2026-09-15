export const CATALOG_FILTERS = {
    all: "All",
    tokusatsu: "Tokusatsu",
    anime: "Anime",
    movies: "Movies",
} as const;
export type CatalogFilter = keyof typeof CATALOG_FILTERS;
export type CatalogItem = {
    id: string;
    title: string;
    category: "tokusatsu" | "anime" | "other";
    format: "series" | "movie";
    franchise: string | null;
    total_episodes: number | null;
    synopsis: string | null;
    cover_image_url: string | null;
    copyright_notice: string | null;
    original_run: string | null;
    release_year: number | null;
    runtime_minutes: number | null;
    revision: number;
    hidden: boolean;
    average_score?: number | null;
    vote_count?: number;
    weighted_score?: number;
};
export type CatalogEpisode = {
    episode_number: number;
    title: string;
    synopsis?: string | null;
    air_date?: string | null;
    episode_type?: string | null;
};
export type CatalogPayload = Pick<
    CatalogItem,
    | "title"
    | "category"
    | "format"
    | "franchise"
    | "total_episodes"
    | "synopsis"
    | "release_year"
    | "runtime_minutes"
> & { episodes: CatalogEpisode[]; original_run?: string | null };
export function catalogParams(input: {
    q?: string | string[];
    filter?: string | string[];
    page?: string | string[];
}) {
    const first = (value: string | string[] | undefined) =>
        Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
    const rawFilter = first(input.filter);
    const rawPage = first(input.page);
    const filter: CatalogFilter = Object.hasOwn(CATALOG_FILTERS, rawFilter)
        ? (rawFilter as CatalogFilter)
        : "all";
    return {
        query: first(input.q).trim().slice(0, 200),
        filter,
        page: /^\d+$/.test(rawPage)
            ? Math.max(1, Math.min(100000, Number(rawPage)))
            : 1,
    };
}
export function isTokuSeries(item: { category?: string; format?: string }) {
    return item.category === "tokusatsu" && item.format === "series";
}
export function normalizeTitle(title: string) {
    return title.trim().replace(/\s+/g, " ").toLowerCase();
}
export function catalogMatches(
    item: Pick<CatalogItem, "category" | "format">,
    filter: CatalogFilter,
) {
    return (
        filter === "all" ||
        (filter === "movies"
            ? item.format === "movie"
            : item.category === filter)
    );
}
export function catalogHref(
    path: string,
    filter: CatalogFilter,
    query: string,
    page = 1,
) {
    const params = new URLSearchParams({
        filter,
        ...(query ? { q: query } : {}),
        page: String(page),
    });
    return `${path}?${params}`;
}
export function validateCatalogPayload(
    payload: CatalogPayload,
    sources: string[],
): string | null {
    if (!payload.title.trim() || payload.title.length > 300)
        return "Enter a title (up to 300 characters).";
    if (
        !["tokusatsu", "anime", "other"].includes(payload.category) ||
        !["series", "movie"].includes(payload.format) ||
        (payload.category === "other" && payload.format !== "movie")
    )
        return "Other content must be a movie.";
    if (
        !sources.length ||
        sources.length > 10 ||
        sources.some((source) => {
            try {
                const url = new URL(source);
                return (
                    url.protocol !== "https:" ||
                    !!url.username ||
                    !!url.password ||
                    source.length > 2000
                );
            } catch {
                return true;
            }
        })
    )
        return "Add 1–10 HTTPS source links.";
    if (payload.format === "movie" && payload.episodes.length)
        return "Movies cannot have episodes.";
    if (payload.episodes.length > 1000)
        return "Submit at most 1000 episodes at a time.";
    const numbers = new Set<number>();
    for (const ep of payload.episodes) {
        if (
            !Number.isInteger(ep.episode_number) ||
            ep.episode_number < 1 ||
            numbers.has(ep.episode_number) ||
            !ep.title.trim()
        )
            return "Episodes need unique positive numbers and titles.";
        numbers.add(ep.episode_number);
    }
    return null;
}
