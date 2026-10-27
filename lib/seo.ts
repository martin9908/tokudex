/**
 * Single source of truth for site-wide SEO values so that <head> metadata,
 * Open Graph tags, sitemap, robots, and JSON-LD all stay consistent.
 *
 * Set NEXT_PUBLIC_SITE_URL to the canonical production origin (no trailing
 * slash). Falls back to the known Vercel URL, then localhost for dev.
 */

export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "") ||
    "https://tokudex.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "TokuDex";

export const SITE_DESCRIPTION =
    "Track tokusatsu, anime, and movies. Save private recaps, contribute missing titles, and discover community favorites. TokuDex does not stream video.";

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
    return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function seriesPath(id: string): string {
    return `/series/${id}`;
}

export function seriesUrl(id: string): string {
    return absoluteUrl(seriesPath(id));
}

/** Trim text to a clean meta-description length, stripping newlines. */
export function truncateDescription(
    text: string | null | undefined,
    max = 155,
): string {
    if (!text) return "";
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1).trimEnd()}…`;
}

type SeriesLike = {
    title: string;
    franchise?: string | null;
    total_episodes?: number | null;
    format?: string;
    synopsis?: string | null;
};

/** A stable meta description for a series, falling back when synopsis is null. */
export function seriesMetaDescription(series: SeriesLike): string {
    if (series.synopsis) return truncateDescription(series.synopsis);
    const parts = [series.title];
    if (series.franchise) parts.push(`(${series.franchise})`);
    const episodes =
        series.format !== "movie" && series.total_episodes
            ? ` — ${series.total_episodes} episodes`
            : "";
    return truncateDescription(
        `Track your progress through ${parts.join(" ")}${episodes} on ${SITE_NAME}.`,
    );
}
