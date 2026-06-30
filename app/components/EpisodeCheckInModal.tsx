"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { saveEpisodeCheckIn } from "../actions";
import { NOTE_MAX_LENGTH } from "@/lib/validation";

type ProgressStatus = "watching" | "completed" | "on_hold" | "plan_to_watch";

type EpisodeCheckInModalProps = {
    open: boolean;
    seriesId: string;
    seriesTitle: string;
    episodeNumber: number;
    episodeTitle?: string | null;
    episodeSynopsis?: string | null;
    onClose: () => void;
    onSaved?: () => void;
};

export default function EpisodeCheckInModal({
    open,
    seriesId,
    seriesTitle,
    episodeNumber,
    episodeTitle,
    episodeSynopsis,
    onClose,
    onSaved,
}: EpisodeCheckInModalProps) {
    const router = useRouter();
    const noteId = useId();
    const statusId = useId();

    const [note, setNote] = useState("");
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
            setError(err instanceof Error ? err.message : "Failed to save check-in");
            setSaving(false);
        }
    }

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#01060dcc] backdrop-blur-sm p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="episode-check-in-title"
            onClick={saving ? undefined : onClose}
        >
            <div
                className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-cyan-900/45 bg-[#12202f]/95 p-4 sm:p-5"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70 mb-1">
                            Episode Check-in
                        </p>
                        <h2 id="episode-check-in-title" className="text-2xl font-bold leading-tight">
                            {seriesTitle}
                        </h2>
                        <p className="text-cyan-100/75 text-sm mt-1">
                            Episode {episodeNumber}
                            {episodeTitle ? ` · ${episodeTitle}` : ""}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="tdx-focus-ring rounded-lg border border-cyan-900/60 px-2 py-1 text-sm text-cyan-100 hover:bg-cyan-500/10 disabled:opacity-50"
                        aria-label="Close episode check-in"
                    >
                        Close
                    </button>
                </div>

                {error && (
                    <p className="mb-4 rounded-xl border border-red-900/45 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                        {error}
                    </p>
                )}

                <p className="mb-4 text-sm text-cyan-100/70">
                    Mark how far you&apos;ve watched and jot a recap so you remember what happened next time.
                </p>

                {episodeSynopsis && (
                    <div className="mb-4 rounded-xl border border-cyan-900/50 bg-[#081a2b]/70 p-3">
                        <p className="text-[11px] uppercase tracking-wider text-cyan-300/70 mb-1">
                            Episode recap
                        </p>
                        <p className="text-sm text-cyan-100/85 leading-relaxed">{episodeSynopsis}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor={noteId} className="text-sm font-medium text-cyan-100/90 block mb-2">
                            Quick recap note
                        </label>
                        <textarea
                            id={noteId}
                            rows={4}
                            value={note}
                            maxLength={NOTE_MAX_LENGTH}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What happened in this episode?"
                            className="w-full rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/40 outline-none focus:ring-2 focus:ring-cyan-500/60"
                        />
                        <p className="mt-1 text-right text-xs text-cyan-200/75">
                            {note.length}/{NOTE_MAX_LENGTH}
                        </p>
                    </div>

                    <div>
                        <label htmlFor={statusId} className="text-sm font-medium text-cyan-100/90 block mb-2">
                            Status
                        </label>
                        <div className="relative">
                            <select
                                id={statusId}
                                value={status}
                                onChange={(e) => setStatus(e.target.value as ProgressStatus)}
                                className="w-full appearance-none rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-2.5 pr-10 text-sm text-cyan-50 outline-none focus:ring-2 focus:ring-cyan-500/60"
                            >
                                <option value="watching">Watching</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                                <option value="plan_to_watch">Plan to Watch</option>
                            </select>
                            <svg
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                            >
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 min-w-[150px] min-h-[44px] rounded-lg border border-cyan-900/60 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-500/10 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 min-w-[150px] min-h-[44px] rounded-lg bg-cyan-500/90 text-[#031018] px-4 py-2.5 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save and Mark Watched"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}