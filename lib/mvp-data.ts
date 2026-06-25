export type Franchise = "Kamen Rider" | "Super Sentai" | "Ultraman";

export type EpisodeSummary = {
    episodeNumber: number;
    title: string;
    synopsis: string;
};

export type Series = {
    id: string;
    title: string;
    franchise: Franchise;
    totalEpisodes: number;
    synopsis: string;
    episodes: EpisodeSummary[];
};

export type UserSeriesProgress = {
    seriesId: string;
    currentEpisode: number;
    status: "Watching" | "Completed";
    lastWatchedAt: string;
    personalNote: string;
};

export const mvpSeries: Series[] = [
    {
        id: "kuuga",
        title: "Kamen Rider Kuuga",
        franchise: "Kamen Rider",
        totalEpisodes: 49,
        synopsis:
            "Yusuke Godai becomes Kuuga and fights the Gurongi while discovering what it means to protect people with a smile.",
        episodes: [
            {
                episodeNumber: 10,
                title: "Distance",
                synopsis:
                    "The investigation tightens as Godai and Ichijo begin predicting Gurongi movement patterns.",
            },
            {
                episodeNumber: 11,
                title: "Promise",
                synopsis:
                    "A near miss pushes Godai to promise he will keep civilians out of the battlefield.",
            },
            {
                episodeNumber: 12,
                title: "Teacher",
                synopsis:
                    "Godai unlocks a stronger fighting approach after protecting students during a surprise attack.",
            },
            {
                episodeNumber: 13,
                title: "Triangle",
                synopsis:
                    "Kuuga tracks a new Gurongi pattern connected to a triangular set of urban attack zones.",
            },
        ],
    },
    {
        id: "king-ohger",
        title: "Ohsama Sentai King-Ohger",
        franchise: "Super Sentai",
        totalEpisodes: 50,
        synopsis:
            "Five rival monarchs are forced to unite against Bugnarok while balancing their own kingdoms and politics.",
        episodes: [
            {
                episodeNumber: 2,
                title: "Who Is The Real King?",
                synopsis:
                    "Rita and Kaguragi challenge Gira's claim while the team learns to fight as a unit.",
            },
            {
                episodeNumber: 3,
                title: "Fury Of The Crown",
                synopsis:
                    "The kings repel a Bugnarok push but cracks in trust become obvious after the victory.",
            },
            {
                episodeNumber: 4,
                title: "A Kingdom's Weight",
                synopsis:
                    "Gira chooses civilians over tactical advantage, shifting how the others view him.",
            },
        ],
    },
    {
        id: "blazar",
        title: "Ultraman Blazar",
        franchise: "Ultraman",
        totalEpisodes: 25,
        synopsis:
            "Captain Gento forms an unusual bond with Blazar while SKaRD responds to kaiju incidents.",
        episodes: [
            {
                episodeNumber: 12,
                title: "Operation Skybridge",
                synopsis:
                    "SKaRD uses a coordinated lure plan to keep downtown safe during a multi-kaiju event.",
            },
            {
                episodeNumber: 13,
                title: "Signal In The Storm",
                synopsis:
                    "A mysterious signal interferes with comms, forcing Gento to improvise field command.",
            },
            {
                episodeNumber: 14,
                title: "Counter Pulse",
                synopsis:
                    "Blazar counters a high-frequency kaiju attack with help from an upgraded SKaRD device.",
            },
        ],
    },
];

export const mvpProgress: UserSeriesProgress[] = [
    {
        seriesId: "kuuga",
        currentEpisode: 12,
        status: "Watching",
        lastWatchedAt: "2026-06-24T22:30:00.000Z",
        personalNote:
            "Godai protected the school route and discovered a better close-range rhythm against the Gurongi.",
    },
    {
        seriesId: "king-ohger",
        currentEpisode: 3,
        status: "Watching",
        lastWatchedAt: "2026-06-22T21:15:00.000Z",
        personalNote:
            "The alliance still feels fragile. Watch how Rita reacts in the next political showdown.",
    },
    {
        seriesId: "blazar",
        currentEpisode: 14,
        status: "Watching",
        lastWatchedAt: "2026-06-21T19:00:00.000Z",
        personalNote:
            "Signal interference hints at a bigger enemy manipulating kaiju behavior.",
    },
];

export function getSeriesById(seriesId: string) {
    return mvpSeries.find((series) => series.id === seriesId);
}

export function getProgressBySeriesId(seriesId: string) {
    return mvpProgress.find((entry) => entry.seriesId === seriesId);
}
