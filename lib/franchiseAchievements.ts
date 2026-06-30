/**
 * Franchise-specific, themed achievements ("collections").
 *
 * Two kinds:
 *   • mode "count" — finish N series of a franchise. Robust: matches on the
 *     `franchise` column, so it works regardless of exact titles.
 *   • mode "all"   — finish every series in a curated set (by title). Titles are
 *     matched case/punctuation-insensitively, but they still must correspond to
 *     rows in YOUR catalog. EDIT the `series` lists below to match your catalog
 *     and your definition of each set — they're starting points, not gospel.
 */

export type CollectionMode = "count" | "all" | "spread";

export type Collection = {
    key: string;
    title: string;
    description: string;
    mode: CollectionMode;
    franchise?: string; // for "count"
    count?: number; // for "count"
    series?: string[]; // for "all"
    franchises?: string[]; // for "spread" — ≥1 completed in each
};

export const COLLECTIONS: Collection[] = [
    // ---- Kamen Rider ------------------------------------------------------
    {
        key: "kr-first",
        title: "Henshin!",
        description: "Finish a Kamen Rider series",
        mode: "count",
        franchise: "Kamen Rider",
        count: 1,
    },
    {
        key: "kr-heisei-1",
        title: "Destroyer of Worlds",
        description: "Finish every Heisei Phase 1 Kamen Rider",
        mode: "all",
        series: [
            "Kamen Rider Kuuga",
            "Kamen Rider Agito",
            "Kamen Rider Ryuki",
            "Kamen Rider 555",
            "Kamen Rider Blade",
            "Kamen Rider Hibiki",
            "Kamen Rider Kabuto",
            "Kamen Rider Den-O",
            "Kamen Rider Kiva",
            "Kamen Rider Decade",
        ],
    },
    {
        key: "kr-heisei-2",
        title: "Best Match",
        description: "Finish every Neo-Heisei Kamen Rider (W → Zi-O)",
        mode: "all",
        series: [
            "Kamen Rider W",
            "Kamen Rider OOO",
            "Kamen Rider Fourze",
            "Kamen Rider Wizard",
            "Kamen Rider Gaim",
            "Kamen Rider Drive",
            "Kamen Rider Ghost",
            "Kamen Rider Ex-Aid",
            "Kamen Rider Build",
            "Kamen Rider Zi-O",
        ],
    },
    {
        key: "kr-reiwa",
        title: "Reiwa Rising",
        description: "Finish every Reiwa Kamen Rider",
        mode: "all",
        series: [
            "Kamen Rider Zero-One",
            "Kamen Rider Saber",
            "Kamen Rider Revice",
            "Kamen Rider Geats",
            "Kamen Rider Gotchard",
            "Kamen Rider Gavv",
        ],
    },
    {
        key: "kr-veteran",
        title: "Rider Veteran",
        description: "Finish 5 Kamen Rider series",
        mode: "count",
        franchise: "Kamen Rider",
        count: 5,
    },
    {
        key: "kr-legend",
        title: "Rider Legend",
        description: "Finish 10 Kamen Rider series",
        mode: "count",
        franchise: "Kamen Rider",
        count: 10,
    },

    // ---- Super Sentai -----------------------------------------------------
    {
        key: "ss-first",
        title: "Roll Call",
        description: "Finish a Super Sentai series",
        mode: "count",
        franchise: "Super Sentai",
        count: 1,
    },
    {
        key: "ss-anniversary",
        title: "Forever Red",
        description: "Finish every Super Sentai anniversary series",
        mode: "all",
        series: [
            "Hyakujuu Sentai Gaoranger",
            "GoGo Sentai Boukenger",
            "Kaizoku Sentai Gokaiger",
            "Doubutsu Sentai Zyuohger",
            "Kikai Sentai Zenkaiger",
            "No.1 Sentai Gozyuger",
        ],
    },
    {
        key: "ss-legend",
        title: "Super Sentai Legend",
        description: "Finish 5 Super Sentai series",
        mode: "count",
        franchise: "Super Sentai",
        count: 5,
    },
    {
        key: "ss-commander",
        title: "Sentai Commander",
        description: "Finish 10 Super Sentai series",
        mode: "count",
        franchise: "Super Sentai",
        count: 10,
    },

    // ---- Ultraman ---------------------------------------------------------
    {
        key: "ult-first",
        title: "Light of Ultra",
        description: "Finish an Ultraman series",
        mode: "count",
        franchise: "Ultraman",
        count: 1,
    },
    {
        key: "ult-land-of-light",
        title: "Land of Light",
        description: "Finish 3 Ultraman series",
        mode: "count",
        franchise: "Ultraman",
        count: 3,
    },
    {
        key: "ult-new-gen",
        title: "New Generation Hero",
        description: "Finish every New Generation Ultraman (Ginga → Arc)",
        mode: "all",
        series: [
            "Ultraman Ginga",
            "Ultraman X",
            "Ultraman Orb",
            "Ultraman Geed",
            "Ultraman R/B",
            "Ultraman Taiga",
            "Ultraman Z",
            "Ultraman Trigger",
            "Ultraman Decker",
            "Ultraman Blazar",
            "Ultraman Arc",
        ],
    },
    {
        key: "ult-showa",
        title: "Original Hero",
        description: "Finish every Showa-era Ultraman",
        mode: "all",
        series: [
            "Ultraman",
            "Ultraseven",
            "Return of Ultraman",
            "Ultraman Ace",
            "Ultraman Taro",
            "Ultraman Leo",
            "Ultraman 80",
        ],
    },

    // ---- Cross-franchise --------------------------------------------------
    {
        key: "trifecta",
        title: "Tokusatsu Trifecta",
        description: "Finish a series from Kamen Rider, Super Sentai, and Ultraman",
        mode: "spread",
        franchises: ["Kamen Rider", "Super Sentai", "Ultraman"],
    },
];

export type CompletedSeries = { title: string; franchise: string | null };

export type CollectionAchievement = Collection & {
    earned: boolean;
    current: number;
    target: number;
};

function normalize(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function evaluateCollections(
    completed: CompletedSeries[]
): CollectionAchievement[] {
    const completedByFranchise = new Map<string, number>();
    const completedTitles = new Set<string>();
    for (const c of completed) {
        completedTitles.add(normalize(c.title));
        const f = c.franchise ?? "";
        completedByFranchise.set(f, (completedByFranchise.get(f) ?? 0) + 1);
    }

    return COLLECTIONS.map((c) => {
        if (c.mode === "count") {
            const n = completedByFranchise.get(c.franchise ?? "") ?? 0;
            const target = c.count ?? 1;
            return { ...c, earned: n >= target, current: Math.min(n, target), target };
        }
        if (c.mode === "spread") {
            const franchises = c.franchises ?? [];
            const have = franchises.filter(
                (f) => (completedByFranchise.get(f) ?? 0) >= 1
            ).length;
            const target = franchises.length;
            return { ...c, earned: target > 0 && have >= target, current: have, target };
        }
        // mode "all"
        const list = c.series ?? [];
        const have = list.filter((t) => completedTitles.has(normalize(t))).length;
        const target = list.length;
        return { ...c, earned: target > 0 && have >= target, current: have, target };
    });
}
