"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import EpisodeCheckInModal from "./EpisodeCheckInModal";
import { setEpisodeProgress } from "../../actions";
import { buttonClasses } from "../atoms";
import { relativeTime } from "@/lib/progress";
import { episodeTypeLabel, isSkippableEpisodeType } from "@/lib/episodeTypes";

type Episode = {
    episode_number: number;
    title: string | null;
    synopsis?: string | null;
    episode_type?: string | null;
    air_date?: string | null;
};

type EpisodeListProps = {
    seriesId: string;
    seriesTitle: string;
    totalEpisodes: number;
    currentEpisode: number;
    episodes: Episode[];
    guest?: boolean;
    notes?: Record<number, string>;
    /** ISO timestamp of the last check-in, shown on the current episode row. */
    lastWatchedAt?: string | null;
};

type Filter = "all" | "unwatched" | "recaps";

/** Rows shown around the current episode before "show all" is pressed. */
const BEFORE = 2;
const AFTER = 6;

function formatAirDate(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Episode list in broadcast order. Watched rows carry your recap inline, the
 * next episode is highlighted with its own actions, and everything past the
 * window collapses behind "show all" so a 50-episode run stays scannable.
 */
export default function EpisodeList({
    seriesId,
    seriesTitle,
    totalEpisodes,
    currentEpisode,
    episodes,
    guest = false,
    notes = {},
    lastWatchedAt = null,
}: EpisodeListProps) {
    const router = useRouter();
    const [openEpisode, setOpenEpisode] = useState<number | null>(null);
    const [pending, setPending] = useState<number | null>(null);
    const [filter, setFilter] = useState<Filter>("all");
    const [hideSkippable, setHideSkippable] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    const nextRef = useRef<HTMLDivElement>(null);

    function scrollToNext() {
        setExpanded(true);
        // Let the expanded rows render before scrolling.
        requestAnimationFrame(() =>
            nextRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            }),
        );
    }

    function setProgress(target: number, episodeNumber: number) {
        setPending(episodeNumber);
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, target);
                router.refresh();
            } catch {
                setError("That didn't save. Check your connection and try again.");
            } finally {
                setPending(null);
            }
        });
    }

    const byNumber = useMemo(() => {
        const map = new Map<number, Episode>();
        for (const entry of episodes) map.set(entry.episode_number, entry);
        return map;
    }, [episodes]);

    // Episode numbers the "hide filler" toggle can remove — filler, clip shows
    // and recaps. Specials/crossovers stay visible; they're tagged for context.
    const skippableNumbers = useMemo(() => {
        const set = new Set<number>();
        for (const [number, entry] of byNumber) {
            if (number <= totalEpisodes && isSkippableEpisodeType(entry.episode_type))
                set.add(number);
        }
        return set;
    }, [byNumber, totalEpisodes]);

    const noteCount = useMemo(
        () =>
            Object.keys(notes).filter(
                (n) => Number(n) <= totalEpisodes && notes[Number(n)]?.trim(),
            ).length,
        [notes, totalEpisodes],
    );

    const next = currentEpisode + 1;

    const matching = useMemo(() => {
        const all = Array.from({ length: totalEpisodes }, (_, i) => i + 1);
        return all.filter((n) => {
            if (hideSkippable && skippableNumbers.has(n)) return false;
            if (filter === "unwatched") return n > currentEpisode;
            if (filter === "recaps") return Boolean(notes[n]?.trim());
            return true;
        });
    }, [totalEpisodes, hideSkippable, skippableNumbers, filter, currentEpisode, notes]);

    // The collapsed window: a couple of watched rows for context, the next
    // episode, and a handful after it. Filters always show every match.
    const windowed = useMemo(() => {
        if (expanded || filter !== "all") return matching;
        const lo = Math.max(1, currentEpisode - BEFORE);
        const hi = Math.min(totalEpisodes, next + AFTER);
        return matching.filter((n) => n >= lo && n <= hi);
    }, [expanded, filter, matching, currentEpisode, next, totalEpisodes]);

    const hiddenBefore = windowed.length
        ? matching.filter((n) => n < windowed[0]).length
        : 0;
    const hiddenAfter = windowed.length
        ? matching.filter((n) => n > windowed[windowed.length - 1]).length
        : matching.length;

    const filters: { key: Filter; label: string }[] = [
        { key: "all", label: `All ${totalEpisodes}` },
        { key: "unwatched", label: "Unwatched" },
        { key: "recaps", label: "With recaps" },
    ];

    return (
        <div>
            <div className="flex items-center gap-3 mb-3.5 flex-wrap">
                <h2 className="text-[17px] font-medium">Episodes</h2>
                <span className="text-[11.5px] text-[var(--text-muted)]">
                    broadcast order
                </span>
                <div className="ml-auto flex items-center gap-2.5 flex-wrap">
                    {!guest && (
                        <div className="tdx-seg tdx-seg-sm" role="group" aria-label="Filter episodes">
                            {filters.map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    aria-pressed={filter === f.key}
                                    onClick={() => setFilter(f.key)}
                                    className="tdx-focus-ring"
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}
                    {skippableNumbers.size > 0 && (
                        <label className="tdx-switch">
                            <input
                                type="checkbox"
                                checked={hideSkippable}
                                onChange={(e) => setHideSkippable(e.target.checked)}
                                className="sr-only"
                            />
                            <span className="tdx-switch-knob" aria-hidden />
                            Hide filler ({skippableNumbers.size})
                        </label>
                    )}
                    {!guest && currentEpisode < totalEpisodes && (
                        <button
                            type="button"
                            onClick={scrollToNext}
                            className={buttonClasses({ variant: "secondary", size: "sm" })}
                        >
                            Jump to {next}
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="tdx-callout tdx-callout-warn mb-3">{error}</div>}

            {guest && (
                <div className="tdx-callout mb-3 items-center">
                    <span className="flex-1">
                        Sign in to log episodes and keep recaps of what happened.
                    </span>
                    <Link href="/login" className={buttonClasses({ size: "sm" })}>
                        Sign in
                    </Link>
                </div>
            )}

            {hiddenBefore > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="tdx-focus-ring block px-3 pb-3 text-xs text-[var(--text-secondary)] rounded"
                >
                    {hiddenBefore} earlier episode{hiddenBefore === 1 ? "" : "s"} ·{" "}
                    <span className="text-[var(--accent-primary)]">show all</span>
                </button>
            )}

            <div className="flex flex-col">
                {windowed.map((n) => {
                    const entry = byNumber.get(n);
                    const title = entry?.title ?? null;
                    const typeLabel = episodeTypeLabel(entry?.episode_type);
                    const note = notes[n]?.trim();
                    const watched = n <= currentEpisode;
                    const isCurrent = n === currentEpisode;
                    const isNext = n === next && !guest;
                    const isPending = pending === n;

                    if (isNext) {
                        const aired = formatAirDate(entry?.air_date);
                        return (
                            <div
                                key={n}
                                ref={nextRef}
                                className="grid grid-cols-[52px_1fr] sm:grid-cols-[52px_1fr_auto] items-center gap-x-3.5 gap-y-2.5 px-3 py-3.5 my-1.5 rounded-md bg-[var(--accent-tint)] border border-[var(--accent-primary)]"
                            >
                                <span className="text-xs text-[var(--accent-on)] tabular-nums">
                                    {n}
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[15px] font-medium text-[var(--accent-on)]">
                                            {title ?? `Episode ${n}`}
                                        </span>
                                        <span className="tdx-chip text-[9.5px] py-0.5 border-[var(--accent-primary)] text-[var(--accent-on)]">
                                            Up next
                                        </span>
                                        {typeLabel && (
                                            <span className="tdx-chip text-[9.5px] py-0.5 border-[var(--accent-primary)] text-[var(--accent-on)]">
                                                {typeLabel}
                                            </span>
                                        )}
                                    </div>
                                    {aired && (
                                        <p className="text-[11.5px] text-[var(--accent-on)] opacity-75 mt-0.5">
                                            Aired {aired}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 col-start-2 sm:col-start-auto">
                                    <button
                                        type="button"
                                        onClick={() => setProgress(n, n)}
                                        disabled={isPending}
                                        className={buttonClasses({
                                            variant: "secondary",
                                            size: "sm",
                                        })}
                                    >
                                        {isPending ? "Saving…" : "Mark watched"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOpenEpisode(n)}
                                        className={buttonClasses({
                                            size: "sm",
                                            className: "bg-[var(--surface)]",
                                        })}
                                    >
                                        Log with recap
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    const status = guest
                        ? (formatAirDate(entry?.air_date) ?? "")
                        : watched
                          ? isCurrent && lastWatchedAt
                              ? relativeTime(lastWatchedAt)
                              : "Watched"
                          : "Not logged";

                    const row = (
                        <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3.5">
                            <span className="text-xs text-[var(--text-muted)] tabular-nums">
                                {n}
                            </span>
                            <div className="flex items-center gap-2 min-w-0">
                                {watched && (
                                    <CheckCircle
                                        size={13}
                                        weight="fill"
                                        className="flex-none text-[var(--accent-primary)]"
                                        aria-label="Watched"
                                    />
                                )}
                                <span
                                    className={`text-[13.5px] truncate ${
                                        watched && !isCurrent
                                            ? "text-[var(--text-secondary)]"
                                            : "text-[var(--text-primary)]"
                                    }`}
                                >
                                    {title ?? `Episode ${n}`}
                                </span>
                                {typeLabel && (
                                    <span className="tdx-chip text-[9.5px] py-0.5 text-[var(--text-muted)]">
                                        {typeLabel}
                                    </span>
                                )}
                            </div>
                            <span className="text-[11.5px] text-[var(--text-muted)] whitespace-nowrap">
                                {isPending ? "Saving…" : status}
                            </span>
                        </div>
                    );

                    return (
                        <div
                            key={n}
                            className={`rounded-md px-3 py-[11px] ${
                                note ? "bg-[var(--sunk)]" : "tdx-row"
                            }`}
                        >
                            {guest ? (
                                row
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setOpenEpisode(n)}
                                    aria-label={`${watched ? "Edit recap for" : "Log"} episode ${n}`}
                                    className="tdx-focus-ring block w-full text-left rounded"
                                >
                                    {row}
                                </button>
                            )}
                            {note && (
                                <div className="tdx-note mt-2 sm:ml-[66px] bg-[var(--surface)]">
                                    <p className="tdx-eyebrow text-[var(--accent-text)] mb-1">
                                        Your recap
                                    </p>
                                    <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap">
                                        {note}
                                    </p>
                                    <div className="mt-1.5 flex gap-3.5 text-[11px]">
                                        {!guest && (
                                            <button
                                                type="button"
                                                onClick={() => setOpenEpisode(n)}
                                                className="tdx-focus-ring text-[var(--accent-primary)] rounded"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <span className="text-[var(--text-muted)]">
                                            {note.length} characters
                                        </span>
                                        {!guest && isCurrent && (
                                            <button
                                                type="button"
                                                onClick={() => setProgress(n - 1, n)}
                                                disabled={isPending}
                                                className="tdx-focus-ring ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
                                            >
                                                Unmark
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {!note && !guest && isCurrent && (
                                <div className="mt-1 sm:ml-[66px] flex gap-3.5 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => setOpenEpisode(n)}
                                        className="tdx-focus-ring text-[var(--accent-primary)] rounded"
                                    >
                                        Add a recap
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProgress(n - 1, n)}
                                        disabled={isPending}
                                        className="tdx-focus-ring text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
                                    >
                                        Unmark
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {windowed.length === 0 && (
                <p className="px-3 py-4 text-sm text-[var(--text-secondary)]">
                    {filter === "recaps"
                        ? "No recaps yet — log an episode with a note and it shows up here."
                        : filter === "unwatched"
                          ? "Nothing left to watch. Every episode is logged."
                          : "No episodes match."}
                </p>
            )}

            {hiddenAfter > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="tdx-focus-ring block px-3 pt-3.5 text-xs text-[var(--text-secondary)] rounded"
                >
                    {hiddenAfter} more episode{hiddenAfter === 1 ? "" : "s"} ·{" "}
                    <span className="text-[var(--accent-primary)]">show all</span>
                </button>
            )}
            {expanded && filter === "all" && matching.length > BEFORE + AFTER + 1 && (
                <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="tdx-focus-ring block px-3 pt-3.5 text-xs text-[var(--text-secondary)] rounded"
                >
                    <span className="text-[var(--accent-primary)]">Collapse</span> to
                    around episode {Math.min(next, totalEpisodes)}
                </button>
            )}

            {hideSkippable && skippableNumbers.size > 0 && (
                <p className="mt-3 px-3 text-xs text-[var(--text-muted)]">
                    {skippableNumbers.size} filler / clip show
                    {skippableNumbers.size === 1 ? "" : "s"} hidden — numbering
                    still follows the broadcast order and your count is unchanged.
                </p>
            )}
            {noteCount > 0 && filter !== "recaps" && (
                <p className="sr-only">{noteCount} episodes have recaps.</p>
            )}

            {!guest && openEpisode !== null && (
                <EpisodeCheckInModal
                    key={openEpisode}
                    open
                    seriesId={seriesId}
                    initialNote={notes[openEpisode] ?? ""}
                    seriesTitle={seriesTitle}
                    episodeNumber={openEpisode}
                    episodeTitle={byNumber.get(openEpisode)?.title ?? null}
                    episodeSynopsis={byNumber.get(openEpisode)?.synopsis ?? null}
                    episodeType={byNumber.get(openEpisode)?.episode_type ?? null}
                    onClose={() => setOpenEpisode(null)}
                />
            )}
        </div>
    );
}
