"use client";

import { useEffect, useId, useState } from "react";
import { getRankProgress } from "../../actions";
import { NOTE_MAX_LENGTH } from "@/lib/validation";
import type { ProgressStatus } from "@/lib/validation";
import { episodeTypeLabel } from "@/lib/episodeTypes";
import { getRank } from "@/lib/achievements";
import { BigNumber, TagChip, buttonClasses } from "../atoms";
import StatusPills from "../molecules/StatusPills";

export type CheckInFormProps = {
    seriesTitle: string;
    episodeNumber: number;
    totalEpisodes?: number | null;
    episodeTitle?: string | null;
    episodeSynopsis?: string | null;
    episodeType?: string | null;
    note: string;
    onNoteChange: (next: string) => void;
    status: ProgressStatus;
    onStatusChange: (next: ProgressStatus) => void;
    saving: boolean;
    error?: string | null;
    /** Save this episode. When `alsoNext` is on, the caller saves n+1 instead. */
    onSave: (alsoNext: boolean) => void;
    onCancel?: () => void;
    /** Where the rank counter starts; fetched when omitted. */
    episodesLogged?: number | null;
};

/**
 * The check-in sheet's body — shared by the bottom-sheet modal and the /watch
 * route. Big episode numeral, status pills, a serif note to self, and a footer
 * that shows where the log lands you on the rank ladder.
 */
export default function CheckInForm({
    seriesTitle,
    episodeNumber,
    totalEpisodes,
    episodeTitle,
    episodeSynopsis,
    episodeType,
    note,
    onNoteChange,
    status,
    onStatusChange,
    saving,
    error,
    onSave,
    onCancel,
    episodesLogged,
}: CheckInFormProps) {
    const noteId = useId();
    const [alsoNext, setAlsoNext] = useState(false);
    const [logged, setLogged] = useState<number | null>(episodesLogged ?? null);

    useEffect(() => {
        if (episodesLogged !== undefined) return;
        let cancelled = false;
        getRankProgress().then((r) => {
            if (!cancelled && r) setLogged(r.logged);
        });
        return () => {
            cancelled = true;
        };
    }, [episodesLogged]);

    const typeLabel = episodeTypeLabel(episodeType);
    const hasNext = !totalEpisodes || episodeNumber < totalEpisodes;
    const after = logged !== null ? logged + (alsoNext ? 2 : 1) : null;
    const rank = after !== null ? getRank(after) : null;

    return (
        <div className="flex flex-col">
            <p className="text-[12.5px] text-[var(--text-secondary)]">
                {seriesTitle}
                {totalEpisodes ? (
                    <span className="text-[var(--text-muted)]">
                        {" "}
                        · Episode {episodeNumber} of {totalEpisodes}
                    </span>
                ) : null}
            </p>
            <div className="flex items-start gap-[18px] mt-4">
                <BigNumber size={86} className="sm:text-[86px] text-[64px]">
                    {episodeNumber}
                </BigNumber>
                <div className="flex-1 min-w-0 pt-2">
                    <p className="text-[15.5px] leading-[1.35]">
                        {episodeTitle ?? `Episode ${episodeNumber}`}
                    </p>
                    <div className="flex gap-1.5 mt-[9px] flex-wrap">
                        <TagChip accent>{typeLabel ?? "Arc"}</TagChip>
                    </div>
                    {episodeSynopsis && (
                        <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[var(--text-secondary)] max-w-[420px]">
                            {episodeSynopsis}
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="tdx-callout tdx-callout-warn mt-5">{error}</div>
            )}

            <div className="mt-6">
                <StatusPills
                    value={status}
                    onChange={onStatusChange}
                    disabled={saving}
                />
            </div>

            <div className="mt-[22px]">
                <label
                    htmlFor={noteId}
                    className="block text-[12.5px] text-[var(--text-secondary)] mb-[9px]"
                >
                    Note to self
                </label>
                <textarea
                    id={noteId}
                    rows={3}
                    value={note}
                    maxLength={NOTE_MAX_LENGTH}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder="What happened, or what to remember next time"
                    className="tdx-field min-h-[88px] text-[14px] leading-[1.6] font-serif"
                    style={{ fontFamily: "ui-serif, Georgia, serif" }}
                />
                <div className="flex justify-between mt-[7px] text-[11px] text-[var(--text-muted)]">
                    <span>Just you</span>
                    <span>
                        {note.length}/{NOTE_MAX_LENGTH}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-[14px] mt-[26px] flex-wrap">
                <button
                    type="button"
                    onClick={() => onSave(alsoNext)}
                    disabled={saving}
                    className={buttonClasses({
                        className: "min-h-[42px] px-[18px]",
                    })}
                >
                    {saving ? "Saving…" : "Log it"}
                </button>
                {hasNext && (
                    <label className="tdx-switch text-[12.5px]">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={alsoNext}
                            disabled={saving}
                            onChange={(e) => setAlsoNext(e.target.checked)}
                        />
                        <span className="tdx-switch-knob" aria-hidden />
                        Also log {episodeNumber + 1}
                    </label>
                )}
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className={buttonClasses({
                            variant: "ghost",
                            size: "sm",
                        })}
                    >
                        Cancel
                    </button>
                )}
                {after !== null && rank && (
                    <span className="ml-auto text-[12px] text-[var(--text-secondary)] tabular-nums">
                        {after.toLocaleString()}
                        {rank.next
                            ? ` · ${(rank.next.min - after).toLocaleString()} to ${rank.next.title.replace("Tokusatsu ", "")}`
                            : ` · ${rank.current.title}`}
                    </span>
                )}
            </div>
        </div>
    );
}
