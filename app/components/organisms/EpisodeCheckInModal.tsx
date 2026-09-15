"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { saveEpisodeCheckIn } from "../../actions";
import { NOTE_MAX_LENGTH } from "@/lib/validation";
import { episodeTypeLabel } from "@/lib/episodeTypes";
import { buttonClasses } from "../atoms";
import StatusChoice, { type ProgressStatus } from "../molecules/StatusChoice";

type EpisodeCheckInModalProps = {
    open: boolean;
    initialNote?: string;
    seriesId: string;
    seriesTitle: string;
    episodeNumber: number;
    episodeTitle?: string | null;
    episodeSynopsis?: string | null;
    episodeType?: string | null;
    onClose: () => void;
    onSaved?: () => void;
};

/**
 * Episode check-in sheet: a note (optional) and the series status, saved in
 * one transaction with the progress update. Slides up from the bottom on
 * phones and sits centred on larger screens.
 */
export default function EpisodeCheckInModal({
    open,
    initialNote = "",
    seriesId,
    seriesTitle,
    episodeNumber,
    episodeTitle,
    episodeSynopsis,
    episodeType,
    onClose,
    onSaved,
}: EpisodeCheckInModalProps) {
    const router = useRouter();
    const noteId = useId();

    const [note, setNote] = useState(initialNote);
    const [status, setStatus] = useState<ProgressStatus>("watching");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };

        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open, onClose, saving]);

    async function handleSave() {
        if (saving) return;

        try {
            setSaving(true);
            setError(null);

            await saveEpisodeCheckIn(seriesId, episodeNumber, status, note);
            router.refresh();
            onSaved?.();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "That check-in didn't save",
            );
            setSaving(false);
        }
    }

    if (!open || typeof document === "undefined") return null;

    const typeLabel = episodeTypeLabel(episodeType);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--shade)] p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="episode-check-in-title"
            onClick={saving ? undefined : onClose}
        >
            <div
                className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-lg border border-[var(--line)] bg-[var(--surface)] px-[18px] pt-2.5 pb-6 sm:p-6"
                onClick={(event) => event.stopPropagation()}
            >
                <div
                    aria-hidden
                    className="sm:hidden mx-auto mb-3.5 h-1 w-9 rounded-[2px] bg-[var(--line)]"
                />
                <p className="tdx-eyebrow tdx-eyebrow-accent">Episode check-in</p>
                <h2
                    id="episode-check-in-title"
                    className="text-[19px] font-medium leading-[1.2] mt-1.5"
                >
                    {seriesTitle}
                </h2>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                    Episode {episodeNumber}
                    {episodeTitle ? ` · ${episodeTitle}` : ""}
                    {typeLabel && (
                        <span className="tdx-chip ml-2 text-[9.5px] py-0.5">
                            {typeLabel}
                        </span>
                    )}
                </p>

                {episodeSynopsis && (
                    <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
                        {episodeSynopsis}
                    </p>
                )}

                {error && (
                    <div className="tdx-callout tdx-callout-warn mt-3.5">
                        {error}
                    </div>
                )}

                <div className="mt-3.5">
                    <label htmlFor={noteId} className="tdx-label">
                        What happened?
                    </label>
                    <textarea
                        id={noteId}
                        rows={4}
                        value={note}
                        maxLength={NOTE_MAX_LENGTH}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="A line or two so you remember next time"
                        className="tdx-field tdx-field-sunk min-h-[104px] text-[13px] leading-[1.5]"
                    />
                    <div className="flex justify-between mt-1.5 text-[11px] text-[var(--text-muted)]">
                        <span>Optional — you can log without one</span>
                        <span>
                            {note.length}/{NOTE_MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <div className="mt-3.5">
                    <p className="tdx-label mb-2">Status</p>
                    <StatusChoice
                        value={status}
                        onChange={setStatus}
                        columns={2}
                        disabled={saving}
                    />
                </div>

                <div className="flex gap-2.5 mt-[18px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className={buttonClasses({
                            variant: "secondary",
                            size: "lg",
                            className: "flex-1",
                        })}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={buttonClasses({
                            size: "lg",
                            className: "flex-[2]",
                        })}
                    >
                        {saving ? "Saving…" : "Save & mark watched"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
