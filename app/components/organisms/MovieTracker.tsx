"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import { saveMovieProgress, setMovieWatched } from "@/app/actions";
import { buttonClasses } from "@/app/components/atoms";
import { NOTE_MAX_LENGTH } from "@/lib/validation";

/**
 * Movie progress is 0/1: the hero shows Watched / Plan to watch as a pair of
 * buttons with the active one drawn in the accent.
 */
export function MovieStatusButtons({
    id,
    watched,
}: {
    id: string;
    watched: boolean;
}) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, startTransition] = useTransition();

    function set(next: boolean) {
        if (next === watched) return;
        setError("");
        startTransition(async () => {
            try {
                await setMovieWatched(id, next);
                router.refresh();
            } catch (e) {
                setError(e instanceof Error ? e.message : "Could not save.");
            }
        });
    }

    return (
        <div className="flex items-center gap-2.5 flex-wrap">
            <button
                type="button"
                aria-pressed={watched}
                disabled={busy}
                onClick={() => set(true)}
                className={buttonClasses({
                    variant: watched ? "primary" : "secondary",
                })}
            >
                <CheckCircle size={15} weight="fill" aria-hidden />
                Watched
            </button>
            <button
                type="button"
                aria-pressed={!watched}
                disabled={busy}
                onClick={() => set(false)}
                className={buttonClasses({
                    variant: watched ? "secondary" : "primary",
                })}
            >
                Plan to watch
            </button>
            <span className="text-xs text-[var(--text-muted)] ml-1">
                {watched ? 1 : 0} / 1
            </span>
            {error && (
                <span role="alert" className="text-xs text-[var(--warning)]">
                    {error}
                </span>
            )}
        </div>
    );
}

/** Private note on a movie — saved with the current watched state. */
export default function MovieTracker({
    id,
    watched,
    initialNote = "",
}: {
    id: string;
    watched: boolean;
    initialNote?: string;
}) {
    const [note, setNote] = useState(initialNote);
    const [saved, setSaved] = useState(initialNote);
    const [message, setMessage] = useState("");
    const [busy, startTransition] = useTransition();
    const dirty = note !== saved;

    function save() {
        setMessage("");
        startTransition(async () => {
            try {
                await saveMovieProgress(id, watched, note);
                setSaved(note);
                setMessage("Saved.");
            } catch (e) {
                setMessage(e instanceof Error ? e.message : "Could not save.");
            }
        });
    }

    return (
        <section className="tdx-panel p-3.5">
            <label htmlFor="movie-note" className="tdx-eyebrow">
                Private note
            </label>
            <textarea
                id="movie-note"
                className="tdx-field tdx-field-sunk mt-2 min-h-[74px] text-[13px] leading-[1.5]"
                value={note}
                maxLength={NOTE_MAX_LENGTH}
                rows={3}
                placeholder="Where you saw it, what stuck with you"
                onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex items-center justify-between gap-3 mt-1.5 text-[11px] text-[var(--text-muted)]">
                <span>Only you can see this</span>
                <span>
                    {note.length}/{NOTE_MAX_LENGTH}
                </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
                <button
                    type="button"
                    className={buttonClasses({ size: "sm" })}
                    disabled={busy || !dirty}
                    onClick={save}
                >
                    {busy ? "Saving…" : "Save note"}
                </button>
                <p role="status" className="text-xs text-[var(--text-secondary)]">
                    {message}
                </p>
            </div>
        </section>
    );
}
