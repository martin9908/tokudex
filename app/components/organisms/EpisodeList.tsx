"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, CaretRight } from "@phosphor-icons/react";
import EpisodeCheckInModal from "./EpisodeCheckInModal";
import { setEpisodeProgress } from "../../actions";
import { buttonClasses } from "../atoms";
import {
    episodeTypeBadgeClass,
    episodeTypeLabel,
    isSkippableEpisodeType,
} from "@/lib/episodeTypes";

type Episode = {
    episode_number: number;
    title: string | null;
    synopsis?: string | null;
    episode_type?: string | null;
};

type EpisodeListProps = {
    seriesId: string;
    seriesTitle: string;
    totalEpisodes: number;
    currentEpisode: number;
    episodes: Episode[];
    guest?: boolean;
    notes?: Record<number, string>;
    allowMarkAll?: boolean;
};

export default function EpisodeList({
    seriesId,
    seriesTitle,
    totalEpisodes,
    currentEpisode,
    episodes,
    guest = false,
    notes = {},
    allowMarkAll = true,
}: EpisodeListProps) {
    const router = useRouter();
    const [openEpisode, setOpenEpisode] = useState<number | null>(null);
    const [pending, setPending] = useState<number | null>(null);
    const [bulkPending, setBulkPending] = useState(false);
    const [confirmMarkAll, setConfirmMarkAll] = useState(false);
    const [hideSkippable, setHideSkippable] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    const nextRef = useRef<HTMLButtonElement>(null);

    function scrollToNext() {
        nextRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }

    function markAll() {
        if (!allowMarkAll) return;
        setBulkPending(true);
        setConfirmMarkAll(false);
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, totalEpisodes);
                router.refresh();
            } catch {
                setError("Could not update progress. Please try again.");
            } finally {
                setBulkPending(false);
            }
        });
    }

    function quickMark(episodeNumber: number, watched: boolean) {
        const target = watched ? episodeNumber - 1 : episodeNumber;
        setPending(episodeNumber);
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, target);
                router.refresh();
            } catch {
                setError("Could not update progress. Please try again.");
            } finally {
                setPending(null);
            }
        });
    }

    const titlesByNumber = useMemo(() => {
        const map = new Map<number, string>();
        for (const entry of episodes) {
            if (entry.title) map.set(entry.episode_number, entry.title);
        }
        return map;
    }, [episodes]);

    const synopsisByNumber = useMemo(() => {
        const map = new Map<number, string>();
        for (const entry of episodes) {
            if (entry.synopsis) map.set(entry.episode_number, entry.synopsis);
        }
        return map;
    }, [episodes]);

    const typeByNumber = useMemo(() => {
        const map = new Map<number, string>();
        for (const entry of episodes) {
            if (entry.episode_type)
                map.set(entry.episode_number, entry.episode_type);
        }
        return map;
    }, [episodes]);

    // Episode numbers the "hide filler" toggle can remove — filler, clip shows
    // and recaps. Specials/crossovers stay visible; they're tagged for context.
    const skippableNumbers = useMemo(() => {
        const set = new Set<number>();
        for (const [number, type] of typeByNumber) {
            if (number <= totalEpisodes && isSkippableEpisodeType(type))
                set.add(number);
        }
        return set;
    }, [typeByNumber, totalEpisodes]);

    const visibleNumbers = useMemo(() => {
        const all = Array.from(
            { length: totalEpisodes },
            (_, index) => index + 1,
        );
        return hideSkippable
            ? all.filter((number) => !skippableNumbers.has(number))
            : all;
    }, [totalEpisodes, hideSkippable, skippableNumbers]);

    const nextEpisodeVisible = visibleNumbers.includes(currentEpisode + 1);
    const showToolbar =
        skippableNumbers.size > 0 || (!guest && currentEpisode < totalEpisodes);

    return (
        <div>
            {error && (
                <p className="mb-3 rounded-lg border border-[var(--warning)] bg-[var(--warning-tint)] px-3 py-2 text-sm text-[var(--warning)]">
                    {error}
                </p>
            )}

            {guest && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--accent-tint)] px-3 py-2">
                    <p className="text-sm text-[var(--accent-on)]">
                        Sign up to log episodes, save recaps, and track your
                        progress.
                    </p>
                    <Link href="/login" className={buttonClasses({ size: "sm" })}>
                        Sign up
                    </Link>
                </div>
            )}

            {showToolbar && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    {skippableNumbers.size > 0 ? (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors">
                            <input
                                type="checkbox"
                                checked={hideSkippable}
                                onChange={(event) =>
                                    setHideSkippable(event.target.checked)
                                }
                                className="tdx-focus-ring h-3.5 w-3.5 accent-[var(--accent-primary)]"
                            />
                            Hide filler &amp; clip shows (
                            {skippableNumbers.size})
                        </label>
                    ) : (
                        <span />
                    )}

                    <div className="flex flex-wrap justify-end gap-2">
                        {!guest && currentEpisode < totalEpisodes && (
                            <>
                                {totalEpisodes > 12 && nextEpisodeVisible && (
                                    <button
                                        type="button"
                                        onClick={scrollToNext}
                                        className="tdx-focus-ring rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
                                    >
                                        Jump to Episode {currentEpisode + 1}
                                    </button>
                                )}
                                {allowMarkAll &&
                                    (confirmMarkAll ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-[var(--warning)] bg-[var(--warning-tint)] px-3 py-1.5">
                                            <span className="text-xs text-[var(--warning)]">
                                                Mark all {totalEpisodes}{" "}
                                                episodes as watched?
                                            </span>
                                            <button
                                                type="button"
                                                onClick={markAll}
                                                disabled={bulkPending}
                                                className="tdx-focus-ring rounded-md bg-[var(--warning)] px-2 py-0.5 text-xs font-semibold text-[#1a1000] hover:opacity-90 disabled:opacity-50 transition-opacity"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirmMarkAll(false)
                                                }
                                                className="tdx-focus-ring rounded-md border border-[var(--line)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setConfirmMarkAll(true)
                                            }
                                            disabled={bulkPending}
                                            className="tdx-focus-ring rounded-lg border border-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-tint)] disabled:opacity-50 transition-colors"
                                        >
                                            {bulkPending
                                                ? "Marking…"
                                                : "Mark all as watched"}
                                        </button>
                                    ))}
                            </>
                        )}
                    </div>
                </div>
            )}

            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {visibleNumbers.map((episodeNumber) => {
                    const isWatched = episodeNumber <= currentEpisode;
                    const isNext = episodeNumber === currentEpisode + 1;
                    const isPending = pending === episodeNumber;
                    const title = titlesByNumber.get(episodeNumber) ?? null;
                    const typeValue = typeByNumber.get(episodeNumber) ?? null;
                    const typeLabel = episodeTypeLabel(typeValue);
                    const typeBadge = typeLabel && (
                        <span
                            className={`mt-1.5 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${episodeTypeBadgeClass(typeValue)}`}
                        >
                            {typeLabel}
                        </span>
                    );

                    return (
                        <li key={episodeNumber}>
                            <div
                                className={`rounded-lg border p-3 transition-colors ${
                                    isNext && !guest
                                        ? "border-[var(--accent-primary)] bg-[var(--accent-tint)]"
                                        : "border-[var(--line)] bg-[var(--surface)]"
                                }`}
                            >
                                {guest ? (
                                    <div>
                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                            Episode {episodeNumber}
                                        </span>
                                        {title && (
                                            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                                                {title}
                                            </p>
                                        )}
                                        {typeBadge}
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            ref={isNext ? nextRef : undefined}
                                            onClick={() =>
                                                setOpenEpisode(episodeNumber)
                                            }
                                            aria-label={`Log episode ${episodeNumber} with a recap`}
                                            className="tdx-focus-ring block w-full rounded-lg text-left"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span
                                                    className={`flex items-center gap-1.5 text-sm font-medium ${
                                                        isNext
                                                            ? "text-[var(--accent-on)]"
                                                            : "text-[var(--text-primary)]"
                                                    }`}
                                                >
                                                    {isWatched && (
                                                        <CheckCircle
                                                            size={14}
                                                            weight="fill"
                                                            className="shrink-0 text-[var(--accent-primary)]"
                                                        />
                                                    )}
                                                    Episode {episodeNumber}
                                                </span>
                                                <span
                                                    className={`text-xs ${isNext ? "text-[var(--accent-on)] opacity-80" : "text-[var(--text-muted)]"}`}
                                                >
                                                    {isWatched
                                                        ? "Watched"
                                                        : isNext
                                                          ? "Up next"
                                                          : "Not logged"}
                                                </span>
                                            </div>
                                            {title && (
                                                <p
                                                    className={`text-xs mt-1 line-clamp-2 ${isNext ? "text-[var(--accent-on)] opacity-90" : "text-[var(--text-secondary)]"}`}
                                                >
                                                    {title}
                                                </p>
                                            )}
                                            {typeBadge}
                                            <p className="mt-2 flex items-center gap-0.5 text-[11px] text-[var(--accent-primary)]">
                                                Log with recap
                                                <CaretRight size={10} />
                                            </p>
                                        </button>
                                        <div className="mt-2 flex justify-end border-t border-[var(--line)] pt-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    quickMark(
                                                        episodeNumber,
                                                        isWatched,
                                                    )
                                                }
                                                disabled={isPending}
                                                className="tdx-focus-ring flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] disabled:opacity-50 transition-colors"
                                            >
                                                {isPending ? (
                                                    "Saving…"
                                                ) : isWatched ? (
                                                    "Unmark"
                                                ) : (
                                                    <>
                                                        <CheckCircle size={11} />
                                                        Mark watched
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {hideSkippable && skippableNumbers.size > 0 && (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                    {skippableNumbers.size} filler / clip show
                    {skippableNumbers.size === 1 ? "" : "s"} hidden — episode
                    numbers still follow the original broadcast order, and your
                    progress count is unchanged.
                </p>
            )}

            {!guest && openEpisode !== null && (
                <EpisodeCheckInModal
                    key={openEpisode}
                    open
                    seriesId={seriesId}
                    initialNote={notes[openEpisode] ?? ""}
                    seriesTitle={seriesTitle}
                    episodeNumber={openEpisode}
                    episodeTitle={titlesByNumber.get(openEpisode) ?? null}
                    episodeSynopsis={synopsisByNumber.get(openEpisode) ?? null}
                    episodeType={typeByNumber.get(openEpisode) ?? null}
                    onClose={() => setOpenEpisode(null)}
                />
            )}
        </div>
    );
}
