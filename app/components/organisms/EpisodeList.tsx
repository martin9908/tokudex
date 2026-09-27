"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import EpisodeCheckInModal from "./EpisodeCheckInModal";
import { saveNote, setEpisodeProgress } from "../../actions";
import { BigNumber, HairlineRule, TagChip, buttonClasses } from "../atoms";
import type { ProgressStatus } from "@/lib/validation";
import { NOTE_MAX_LENGTH } from "@/lib/validation";
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
    status?: ProgressStatus;
    episodes: Episode[];
    guest?: boolean;
    notes?: Record<number, string>;
    /** Tokusatsu episodes logged so far, for the sheet's rank counter. */
    episodesLogged?: number | null;
};

type Filter = "all" | "arc" | "unwatched";

/** Rows shown around the current episode before the list is expanded. */
const BEFORE = 2;
const AFTER = 6;

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
function countWord(n: number) {
    return n < WORDS.length ? WORDS[n] : String(n);
}

function CollapsedRun({
    list,
    currentEpisode,
    notes,
    onExpand,
}: {
    list: number[];
    currentEpisode: number;
    notes: Record<number, string>;
    onExpand: () => void;
}) {
    if (!list.length) return null;
    const logged = list.filter((n) => n <= currentEpisode).length;
    const range =
        list.length === 1 ? `${list[0]}` : `${list[0]}–${list[list.length - 1]}`;
    const noted = list.filter((n) => notes[n]?.trim()).length;
    return (
        <button
            type="button"
            onClick={onExpand}
            className="tdx-focus-ring grid grid-cols-[62px_1fr_auto] items-center gap-[18px] w-full text-left px-[18px] md:px-[30px] py-[9px] text-[11.5px] text-[var(--text-secondary)] hover:bg-[var(--sunk)] rounded"
        >
            <span className="tabular-nums">{range}</span>
            <span>
                {logged === list.length
                    ? `${countWord(logged)} logged${noted ? `, ${noted} with notes` : ", nothing worth flagging"}`
                    : logged === 0
                      ? `${countWord(list.length)} more`
                      : `${logged} logged, ${list.length - logged} to go`}
            </span>
            <span className="text-[var(--accent-primary)]">Show</span>
        </button>
    );
}

/**
 * Episode list in broadcast order, one hairline row per episode. Logged rows
 * dim, the next episode sits on a sunk band, runs of logged episodes outside
 * the window collapse to a one-line summary, and untitled episodes point at
 * the catalog so someone can fix them.
 */
export default function EpisodeList({
    seriesId,
    seriesTitle,
    totalEpisodes,
    currentEpisode,
    status = "watching",
    episodes,
    guest = false,
    notes = {},
    episodesLogged,
}: EpisodeListProps) {
    const router = useRouter();
    const [openEpisode, setOpenEpisode] = useState<number | null>(null);
    const [filter, setFilter] = useState<Filter>("all");
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState<number | null>(null);
    const [editing, setEditing] = useState<number | null>(null);
    const [draft, setDraft] = useState("");
    const [, startTransition] = useTransition();
    const nextRef = useRef<HTMLDivElement>(null);

    const byNumber = useMemo(() => {
        const map = new Map<number, Episode>();
        for (const entry of episodes) map.set(entry.episode_number, entry);
        return map;
    }, [episodes]);

    const skippable = useMemo(() => {
        const set = new Set<number>();
        for (const [number, entry] of byNumber)
            if (number <= totalEpisodes && isSkippableEpisodeType(entry.episode_type))
                set.add(number);
        return set;
    }, [byNumber, totalEpisodes]);

    const gaps = useMemo(() => {
        const list: number[] = [];
        for (let n = 1; n <= totalEpisodes; n++)
            if (!byNumber.get(n)?.title?.trim()) list.push(n);
        return list;
    }, [byNumber, totalEpisodes]);

    const next = currentEpisode + 1;

    const matching = useMemo(() => {
        const all = Array.from({ length: totalEpisodes }, (_, i) => i + 1);
        return all.filter((n) => {
            if (filter === "arc") return !skippable.has(n);
            if (filter === "unwatched") return n > currentEpisode;
            return true;
        });
    }, [totalEpisodes, filter, skippable, currentEpisode]);

    const lo = Math.max(1, currentEpisode - BEFORE);
    const hi = Math.min(totalEpisodes, next + AFTER);
    const windowed = useMemo(
        () =>
            expanded || filter === "unwatched"
                ? matching
                : matching.filter((n) => n >= lo && n <= hi),
        [expanded, filter, matching, lo, hi],
    );
    const before = windowed.length ? matching.filter((n) => n < windowed[0]) : [];
    const after = windowed.length
        ? matching.filter((n) => n > windowed[windowed.length - 1])
        : matching;

    function scrollToNext() {
        setExpanded(true);
        requestAnimationFrame(() =>
            nextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
    }

    function unmark(n: number) {
        setPending(n);
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, n - 1);
                router.refresh();
            } catch {
                setError("That didn't save. Check your connection and try again.");
            } finally {
                setPending(null);
            }
        });
    }

    function commitNote(n: number) {
        setPending(n);
        setError(null);
        startTransition(async () => {
            try {
                await saveNote(seriesId, n, draft.trim());
                setEditing(null);
                router.refresh();
            } catch {
                setError("That note didn't save. Try again.");
            } finally {
                setPending(null);
            }
        });
    }

    const filters: { key: Filter; label: string }[] = [
        { key: "all", label: `All ${totalEpisodes}` },
        ...(skippable.size ? [{ key: "arc" as Filter, label: "Arc only" }] : []),
        { key: "unwatched", label: "Unwatched" },
    ];

    const summary = (
        <span className="ml-auto text-[12px] text-[var(--text-secondary)] whitespace-nowrap">
            {guest ? (
                `${totalEpisodes} episodes`
            ) : (
                <>
                    <span className="hidden sm:inline">{currentEpisode} logged</span>
                    {gaps.length > 0 && (
                        <>
                            <span className="hidden sm:inline"> · </span>
                            {gaps.length} gap{gaps.length === 1 ? "" : "s"}
                        </>
                    )}
                </>
            )}
        </span>
    );

    return (
        <div>
            <div className="flex items-center gap-2.5 md:gap-[18px] px-[18px] md:px-[30px] py-[14px] md:py-4 text-[12px] md:text-[12.5px] flex-wrap">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        aria-pressed={filter === f.key}
                        onClick={() => setFilter(f.key)}
                        className={`tdx-focus-ring px-[11px] md:px-3 py-[6px] rounded-[7px] border transition-colors ${
                            filter === f.key
                                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                : "border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
                {summary}
                {!guest && currentEpisode < totalEpisodes && !expanded && (
                    <button
                        type="button"
                        onClick={scrollToNext}
                        className="tdx-focus-ring hidden md:inline text-[12px] text-[var(--accent-primary)] rounded"
                    >
                        Jump to {next}
                    </button>
                )}
            </div>
            <HairlineRule />

            {error && (
                <div className="tdx-callout tdx-callout-warn mx-[18px] md:mx-[30px] my-3">
                    {error}
                </div>
            )}

            {guest && (
                <div className="tdx-callout mx-[18px] md:mx-[30px] my-3 items-center">
                    <span className="flex-1">
                        Sign in to log episodes and keep notes on what happened.
                    </span>
                    <Link href="/login" className={buttonClasses({ size: "sm" })}>
                        Sign in
                    </Link>
                </div>
            )}

            <CollapsedRun
                list={before}
                currentEpisode={currentEpisode}
                notes={notes}
                onExpand={() => setExpanded(true)}
            />

            <div className="flex flex-col">
                {windowed.map((n) => {
                    const entry = byNumber.get(n);
                    const title = entry?.title?.trim() || null;
                    const typeLabel = episodeTypeLabel(entry?.episode_type);
                    const note = notes[n]?.trim();
                    const logged = !guest && n <= currentEpisode;
                    const isCurrent = !guest && n === currentEpisode;
                    const isNext = !guest && n === next;
                    const tone = isNext ? "accent" : logged ? "dim" : "mute";
                    const isEditing = editing === n;
                    const busy = pending === n;

                    const rowBody = (
                        <>
                            <BigNumber
                                size={30}
                                tone={tone}
                                className="hidden md:inline"
                            >
                                {n}
                            </BigNumber>
                            <span
                                className={`md:hidden text-[17px] font-medium w-[30px] tabular-nums ${
                                    isNext
                                        ? "text-[var(--text-primary)]"
                                        : "text-[var(--text-muted)]"
                                }`}
                            >
                                {n}
                            </span>
                            <div className="min-w-0">
                                <div
                                    className={`text-[13px] md:text-[13.5px] ${
                                        logged && !isNext
                                            ? "text-[var(--text-secondary)]"
                                            : title
                                              ? "text-[var(--text-primary)]"
                                              : "text-[var(--text-secondary)]"
                                    }`}
                                >
                                    {title ??
                                        (guest ? `Episode ${n}` : "Untitled in the catalog")}
                                </div>
                                {isNext && (
                                    <div className="md:hidden text-[11px] text-[var(--accent-primary)] mt-[3px]">
                                        Up next
                                    </div>
                                )}
                                {!title && !guest && (
                                    <div className="md:hidden text-[11px] text-[var(--accent-primary)] mt-[3px]">
                                        Add one
                                    </div>
                                )}
                                {(typeLabel || !title || isNext) && (
                                    <div className="hidden md:flex gap-1.5 mt-[7px] flex-wrap">
                                        {isNext && !typeLabel && <TagChip accent>Arc</TagChip>}
                                        {typeLabel && (
                                            <TagChip accent={isNext}>{typeLabel}</TagChip>
                                        )}
                                        {!title && <TagChip>Missing title</TagChip>}
                                    </div>
                                )}
                            </div>
                            <span
                                className={`hidden md:inline text-[11.5px] whitespace-nowrap ${
                                    isNext
                                        ? "text-[var(--accent-primary)]"
                                        : "text-[var(--text-secondary)]"
                                }`}
                            >
                                {busy ? "Saving…" : isNext ? "Up next" : logged ? "Logged" : ""}
                            </span>
                            <span className="md:hidden">
                                {logged ? (
                                    <CheckCircle
                                        size={19}
                                        weight="fill"
                                        className="text-[var(--accent-primary)]"
                                        aria-label="Logged"
                                    />
                                ) : guest ? null : (
                                    <Circle
                                        size={19}
                                        className="text-[var(--text-secondary)]"
                                        aria-hidden
                                    />
                                )}
                            </span>
                        </>
                    );

                    const rowClass = `grid grid-cols-[30px_1fr_auto] md:grid-cols-[62px_1fr_auto] items-center gap-[13px] md:gap-[18px] px-[18px] md:px-[30px] py-[11px] md:py-[13px] min-h-[48px] w-full text-left ${
                        isNext
                            ? "bg-[var(--sunk)] border-y border-[var(--line)] md:border-0"
                            : "tdx-row rounded-none"
                    }`;

                    return (
                        <div key={n} ref={isNext ? nextRef : undefined}>
                            {guest ? (
                                <div className={rowClass}>{rowBody}</div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (logged) {
                                            setEditing(isEditing ? null : n);
                                            setDraft(note ?? "");
                                        } else setOpenEpisode(n);
                                    }}
                                    aria-label={
                                        logged
                                            ? `Episode ${n} — note`
                                            : `Log episode ${n}`
                                    }
                                    className={`tdx-focus-ring ${rowClass}`}
                                >
                                    {rowBody}
                                </button>
                            )}
                            {logged && (note || isEditing) && (
                                <div className="px-[18px] md:px-[30px] pb-3 md:pl-[110px]">
                                    {isEditing ? (
                                        <div>
                                            <textarea
                                                autoFocus
                                                rows={3}
                                                value={draft}
                                                maxLength={NOTE_MAX_LENGTH}
                                                onChange={(e) => setDraft(e.target.value)}
                                                className="tdx-field text-[13.5px] leading-[1.6]"
                                                style={{ fontFamily: "ui-serif, Georgia, serif" }}
                                                placeholder="Note to self — just you"
                                            />
                                            <div className="flex gap-3 mt-2 text-[11.5px] items-center">
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => commitNote(n)}
                                                    className={buttonClasses({ size: "sm" })}
                                                >
                                                    {busy ? "Saving…" : "Save note"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditing(null)}
                                                    className={buttonClasses({ variant: "ghost", size: "sm" })}
                                                >
                                                    Cancel
                                                </button>
                                                {isCurrent && (
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => unmark(n)}
                                                        className="tdx-focus-ring ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
                                                    >
                                                        Unmark {n}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p
                                            className="text-[13px] leading-[1.6] text-[var(--text-secondary)] whitespace-pre-wrap"
                                            style={{ fontFamily: "ui-serif, Georgia, serif" }}
                                        >
                                            {note}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {windowed.length === 0 && (
                <p className="px-[18px] md:px-[30px] py-4 text-sm text-[var(--text-secondary)]">
                    {filter === "unwatched"
                        ? "Nothing left to watch. Every episode is logged."
                        : "No episodes match."}
                </p>
            )}

            <CollapsedRun
                list={after}
                currentEpisode={currentEpisode}
                notes={notes}
                onExpand={() => setExpanded(true)}
            />

            <div className="px-[18px] md:px-[30px] pt-[15px] pb-[24px] text-[12px] text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1.5">
                {gaps.length > 0 && (
                    <span>
                        Ep {gaps.slice(0, 3).join(", ")}
                        {gaps.length > 3 ? ` and ${gaps.length - 3} more` : ""}{" "}
                        {gaps.length === 1 ? "has" : "have"} no title on record —{" "}
                        <Link
                            href={`/community/new?id=${seriesId}`}
                            className="text-[var(--accent-primary)]"
                        >
                            Add one
                        </Link>
                    </span>
                )}
                {expanded && (
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="tdx-focus-ring rounded"
                    >
                        <span className="text-[var(--accent-primary)]">Collapse</span> to
                        around episode {Math.min(next, totalEpisodes)}
                    </button>
                )}
                {filter === "arc" && skippable.size > 0 && (
                    <span className="text-[var(--text-muted)]">
                        {skippable.size} filler / clip show
                        {skippable.size === 1 ? "" : "s"} hidden — numbering still
                        follows the broadcast order.
                    </span>
                )}
            </div>

            {openEpisode !== null && (
                <EpisodeCheckInModal
                    open
                    seriesId={seriesId}
                    seriesTitle={seriesTitle}
                    totalEpisodes={totalEpisodes}
                    episodeNumber={openEpisode}
                    episodeTitle={byNumber.get(openEpisode)?.title}
                    episodeSynopsis={byNumber.get(openEpisode)?.synopsis}
                    episodeType={byNumber.get(openEpisode)?.episode_type}
                    initialNote={notes[openEpisode] ?? ""}
                    initialStatus={status === "plan_to_watch" ? "watching" : status}
                    episodesLogged={episodesLogged}
                    onClose={() => setOpenEpisode(null)}
                />
            )}
        </div>
    );
}
