/**
 * Single-player achievements + rank, derived entirely from a user's existing
 * tracking data (no extra storage). Pure functions so they're trivial to test.
 */

export type AchievementInput = {
    seriesTracked: number;
    episodesLogged: number;
    seriesCompleted: number;
};

export type Rank = { title: string; min: number };

// Themed ranks keyed off total episodes logged.
const RANKS: Rank[] = [
    { title: "Newcomer", min: 0 },
    { title: "Rookie", min: 1 },
    { title: "Henshin Cadet", min: 25 },
    { title: "Tokusatsu Fan", min: 100 },
    { title: "Veteran Viewer", min: 250 },
    { title: "Tokusatsu Master", min: 500 },
    { title: "Grand Commander", min: 1000 },
];

export function getRank(episodesLogged: number): { current: Rank; next: Rank | null } {
    let current = RANKS[0];
    let next: Rank | null = null;
    for (let i = 0; i < RANKS.length; i++) {
        if (episodesLogged >= RANKS[i].min) {
            current = RANKS[i];
            next = RANKS[i + 1] ?? null;
        }
    }
    return { current, next };
}

export type Achievement = {
    key: string;
    label: string;
    description: string;
    earned: boolean;
    current: number;
    target: number;
};

export function getAchievements(input: AchievementInput): Achievement[] {
    const { seriesTracked, episodesLogged, seriesCompleted } = input;

    const make = (
        key: string,
        label: string,
        description: string,
        current: number,
        target: number
    ): Achievement => ({
        key,
        label,
        description,
        earned: current >= target,
        current: Math.min(current, target),
        target,
    });

    return [
        make("first-series", "First Steps", "Track your first series", seriesTracked, 1),
        make("log-10", "Getting Started", "Log 10 episodes", episodesLogged, 10),
        make("complete-1", "Completionist", "Finish a series", seriesCompleted, 1),
        make("track-5", "Collector", "Track 5 series", seriesTracked, 5),
        make("log-100", "Centurion", "Log 100 episodes", episodesLogged, 100),
        make("complete-3", "Triple Threat", "Finish 3 series", seriesCompleted, 3),
        make("log-500", "Marathon", "Log 500 episodes", episodesLogged, 500),
    ];
}

export function countEarned(achievements: Achievement[]): number {
    return achievements.filter((a) => a.earned).length;
}
