"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { saveEpisodeCheckIn } from "../../actions";
import type { ProgressStatus } from "@/lib/validation";
import CheckInForm from "./CheckInForm";

type EpisodeCheckInModalProps = {
    open: boolean;
    initialNote?: string;
    initialStatus?: ProgressStatus;
    seriesId: string;
    seriesTitle: string;
    totalEpisodes?: number | null;
    episodeNumber: number;
    episodeTitle?: string | null;
    episodeSynopsis?: string | null;
    episodeType?: string | null;
    episodesLogged?: number | null;
    onClose: () => void;
    onSaved?: () => void;
};

/**
 * Episode check-in sheet: status + note saved in one transaction with the
 * progress update. Slides up from the bottom on phones and sits centred on
 * larger screens.
 */
export default function EpisodeCheckInModal({
    open,
    initialNote = "",
    initialStatus = "watching",
    seriesId,
    seriesTitle,
    totalEpisodes,
    episodeNumber,
    episodeTitle,
    episodeSynopsis,
    episodeType,
    episodesLogged,
    onClose,
    onSaved,
}: EpisodeCheckInModalProps) {
    const router = useRouter();
    const [note, setNote] = useState(initialNote);
    const [status, setStatus] = useState<ProgressStatus>(initialStatus);
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

    async function handleSave(alsoNext: boolean) {
        if (saving) return;
        try {
            setSaving(true);
            setError(null);
            await saveEpisodeCheckIn(seriesId, episodeNumber, status, note);
            if (alsoNext)
                await saveEpisodeCheckIn(seriesId, episodeNumber + 1, status, "");
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

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--shade)] p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Log episode ${episodeNumber} of ${seriesTitle}`}
            onClick={saving ? undefined : onClose}
        >
            <div
                className="w-full sm:max-w-[560px] max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-lg border border-[var(--line)] bg-[var(--background)] px-[22px] sm:px-[28px] pt-[18px] sm:pt-[22px] pb-[26px]"
                onClick={(event) => event.stopPropagation()}
            >
                <div
                    aria-hidden
                    className="sm:hidden mx-auto mb-3.5 h-1 w-9 rounded-[2px] bg-[var(--line)]"
                />
                <CheckInForm
                    seriesTitle={seriesTitle}
                    episodeNumber={episodeNumber}
                    totalEpisodes={totalEpisodes}
                    episodeTitle={episodeTitle}
                    episodeSynopsis={episodeSynopsis}
                    episodeType={episodeType}
                    note={note}
                    onNoteChange={setNote}
                    status={status}
                    onStatusChange={setStatus}
                    saving={saving}
                    error={error}
                    onSave={handleSave}
                    onCancel={onClose}
                    episodesLogged={episodesLogged}
                />
            </div>
        </div>,
        document.body,
    );
}
