import Link from "next/link";
import { PosterImage, Bar, HairlineRule, buttonClasses } from "../components/atoms";
import type { WatchItem } from "@/lib/progress";

export const DEX_FILTERS = {
    all: "All",
    sentai: "Sentai",
    rider: "Rider",
    ultra: "Ultra",
    movies: "Movies",
} as const;
export type DexFilterKey = keyof typeof DEX_FILTERS;

export function dexMatches(series: WatchItem["series"], filter: DexFilterKey) {
    switch (filter) {
        case "sentai":
            return /sentai/i.test(series.franchise ?? "");
        case "rider":
            return /rider/i.test(series.franchise ?? "");
        case "ultra":
            return /ultra/i.test(series.franchise ?? "");
        case "movies":
            return series.format === "movie";
        default:
            return true;
    }
}

function familyLabel(series: WatchItem["series"]) {
    const f = series.franchise ?? "";
    if (/sentai/i.test(f)) return "Sentai";
    if (/rider/i.test(f)) return "Rider";
    if (/ultra/i.test(f)) return "Ultra";
    if (series.format === "movie") return "Movie";
    if (f) return f;
    return series.category.charAt(0).toUpperCase() + series.category.slice(1);
}

/**
 * Your dex: every title you track, one hairline row each — small poster,
 * title and meta, a 2px bar, and the count on the right.
 */
export default function DexList({
    items,
    filter,
    catalogTotal,
    ratings,
    addedByYou,
}: {
    items: WatchItem[];
    filter: DexFilterKey;
    catalogTotal: number;
    ratings: Record<string, number>;
    addedByYou: Set<string>;
}) {
    const shown = items.filter((i) => dexMatches(i.series, filter));
    const waitingOnArt = items.find((i) => !i.series.cover_image_url);

    return (
        <div className="w-full pb-24 md:pb-10">
            <div className="flex items-baseline gap-3 md:gap-5 px-[18px] md:px-[30px] pt-[22px] md:pt-[26px] pb-[16px] md:pb-[20px] flex-wrap">
                <h1 className="text-[20px] md:text-[26px] font-medium tracking-[-0.025em]">
                    Your dex
                </h1>
                <span className="text-[12.5px] text-[var(--text-secondary)]">
                    {items.length} of {catalogTotal.toLocaleString()} titles
                </span>
                <nav
                    aria-label="Filter"
                    className="w-full md:w-auto md:ml-auto flex gap-2.5 md:gap-[18px] text-[12px] md:text-[12.5px] overflow-x-auto"
                >
                    {Object.entries(DEX_FILTERS).map(([key, label]) => (
                        <Link
                            key={key}
                            href={key === "all" ? "/series" : `/series?filter=${key}`}
                            aria-current={filter === key ? "page" : undefined}
                            className={`tdx-focus-ring px-3 py-[6px] rounded-[7px] border whitespace-nowrap transition-colors ${
                                filter === key
                                    ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                    : "border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </div>
            <HairlineRule />

            {shown.length === 0 ? (
                <div className="px-[18px] md:px-[30px] py-8">
                    <p className="text-[15px]">
                        {items.length === 0
                            ? "Nothing tracked yet"
                            : "Nothing in this shelf"}
                    </p>
                    <p className="text-[12.5px] text-[var(--text-secondary)] mt-1.5 max-w-[420px] leading-[1.55]">
                        {items.length === 0
                            ? "Pick a series you're watching and log the episode you're on. Everything else follows from that."
                            : "Try another filter, or add something from the shared catalog."}
                    </p>
                    <div className="flex gap-2.5 mt-4 flex-wrap">
                        <Link href="/community/catalog" className={buttonClasses()}>
                            Browse the catalog
                        </Link>
                        {items.length === 0 && (
                            <Link
                                href="/welcome"
                                className={buttonClasses({ variant: "secondary" })}
                            >
                                Get started
                            </Link>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    {shown.map(({ series: s, progress: p }) => {
                        const isMovie = s.format === "movie";
                        const total = s.total_episodes;
                        const rating = ratings[s.id];
                        const meta = [
                            familyLabel(s),
                            s.release_year,
                            addedByYou.has(s.id) ? "you added this" : null,
                            p.status === "on_hold"
                                ? `shelved at ${p.current_episode}`
                                : null,
                        ]
                            .filter(Boolean)
                            .join(" · ");
                        const right = isMovie
                            ? p.current_episode === 1
                                ? `Watched${rating ? ` · ${rating}/10` : ""}`
                                : "Someday"
                            : p.current_episode === 0
                              ? "Not started"
                              : total && p.current_episode >= total
                                ? `All ${total}`
                                : `${p.current_episode} / ${total ?? "?"}`;
                        return (
                            <Link
                                key={s.id}
                                href={`/series/${s.id}`}
                                className="tdx-row tdx-focus-ring rounded-none grid grid-cols-[42px_1fr_auto] md:grid-cols-[42px_1fr_150px_92px] gap-[13px] md:gap-[18px] items-center px-[18px] md:px-[30px] py-3"
                            >
                                {s.cover_image_url ? (
                                    <div className="relative w-[42px] aspect-[3/4] rounded overflow-hidden">
                                        <PosterImage
                                            src={s.cover_image_url}
                                            alt=""
                                            sizes="42px"
                                            pendingLabel=""
                                        />
                                    </div>
                                ) : (
                                    <div className="w-[42px] aspect-[3/4] rounded bg-[var(--sunk)] grid place-items-center text-[9.5px] leading-[1.2] text-center text-[var(--text-secondary)]">
                                        no
                                        <br />
                                        art
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-[13.5px] truncate">{s.title}</p>
                                    <p className="text-[11.5px] text-[var(--text-secondary)] mt-1 truncate">
                                        {meta}
                                    </p>
                                </div>
                                <div className="hidden md:block">
                                    {!isMovie && total ? (
                                        <Bar value={p.current_episode} max={total} />
                                    ) : null}
                                </div>
                                <span className="text-right text-[12px] text-[var(--text-secondary)] whitespace-nowrap tabular-nums">
                                    {right}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}

            {waitingOnArt && (
                <p className="px-[18px] md:px-[30px] pt-4 pb-6 text-[12px] text-[var(--text-secondary)]">
                    {waitingOnArt.series.title} is still waiting on art —{" "}
                    <span className="text-[var(--accent-primary)]">Admins get to it</span>
                </p>
            )}
            {!waitingOnArt && shown.length > 0 && (
                <p className="px-[18px] md:px-[30px] pt-4 pb-6 text-[12px] text-[var(--text-secondary)]">
                    Missing something?{" "}
                    <Link href="/community/catalog" className="text-[var(--accent-primary)]">
                        Browse the shared catalog
                    </Link>
                    {" · "}
                    <Link href="/community/new" className="text-[var(--accent-primary)]">
                        Add a title
                    </Link>
                </p>
            )}
        </div>
    );
}
