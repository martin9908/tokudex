/**
 * Per-series "flavor" badges — a themed trophy for finishing a specific series.
 * Earned when that series' status is "completed".
 *
 * Match is on title (case/punctuation-insensitive) so it must correspond to a
 * row in your catalog. EDIT freely — add a line per series with a fun, on-theme
 * name. Series without an entry just show as a plain "✓ <title>" trophy.
 */

export type SeriesBadge = { key: string; series: string; name: string };

export const SERIES_BADGES: SeriesBadge[] = [
    // --- Kamen Rider (catalog + classics) ---
    { key: "kuuga", series: "Kamen Rider Kuuga", name: "A New Hero" },
    { key: "agito", series: "Kamen Rider Agito", name: "Unknown Power" },
    { key: "den-o", series: "Kamen Rider Den-O", name: "Climax Time!" },
    { key: "w", series: "Kamen Rider W", name: "Hard-Boiled" },
    { key: "ooo", series: "Kamen Rider OOO", name: "Medals of Desire" },
    { key: "zero-one", series: "Kamen Rider Zero-One", name: "A.I. Dawn" },
    { key: "saber", series: "Kamen Rider Saber", name: "The Story Begins" },
    { key: "revice", series: "Kamen Rider Revice", name: "Two as One" },
    { key: "geats", series: "Kamen Rider Geats", name: "Desire Granted" },
    { key: "gotchard", series: "Kamen Rider Gotchard", name: "Alchemy Complete" },
    { key: "gavv", series: "Kamen Rider Gavv", name: "Sweet Justice" },
    { key: "zeztz", series: "Kamen Rider Zeztz", name: "New Blood" },

    // --- Super Sentai ---
    { key: "gokaiger", series: "Kaizoku Sentai Gokaiger", name: "Pirate's Treasure" },
    { key: "king-ohger", series: "Ohsama Sentai King-Ohger", name: "Long Live the King" },
    { key: "boonboomger", series: "Bakuage Sentai Boonboomger", name: "Full Throttle" },
    { key: "gozyuger", series: "No.1 Sentai Gozyuger", name: "Number One" },

    // --- Ultraman ---
    { key: "arc", series: "Ultraman Arc", name: "Imagination Unleashed" },
];

function normalize(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const BY_TITLE = new Map(SERIES_BADGES.map((b) => [normalize(b.series), b]));

export function badgeForSeries(title: string): SeriesBadge | undefined {
    return BY_TITLE.get(normalize(title));
}

export type EarnedSeriesBadge = { key: string; name: string };

export function getEarnedSeriesBadges(completedTitles: string[]): EarnedSeriesBadge[] {
    const out: EarnedSeriesBadge[] = [];
    for (const t of completedTitles) {
        const b = badgeForSeries(t);
        if (b) out.push({ key: b.key, name: b.name });
    }
    return out;
}
