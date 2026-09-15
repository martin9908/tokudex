"use client";
import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { saveMovieProgress } from "@/app/actions";
import { buttonClasses } from "@/app/components/atoms";
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
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    async function save(next: boolean) {
        setBusy(true);
        setMessage("");
        try {
            await saveMovieProgress(id, next, note);
            setMessage("Saved.");
        } catch (e) {
            setMessage(e instanceof Error ? e.message : "Could not save.");
        } finally {
            setBusy(false);
        }
    }
    return (
        <section className="tdx-panel p-5 space-y-3">
            <div className="flex items-center gap-2">
                {watched && (
                    <CheckCircle
                        size={18}
                        weight="fill"
                        className="text-[var(--accent-primary)]"
                    />
                )}
                <h2 className="text-lg">
                    {watched ? "Watched" : "Plan to Watch"}
                </h2>
            </div>
            <label className="block text-sm text-[var(--text-secondary)]">
                Private movie note
                <textarea
                    className="tdx-field p-3 mt-2 text-[var(--text-primary)]"
                    value={note}
                    maxLength={5000}
                    rows={4}
                    onChange={(e) => setNote(e.target.value)}
                />
            </label>
            <div className="flex flex-wrap gap-3">
                <button
                    className={buttonClasses({ size: "sm" })}
                    disabled={busy}
                    onClick={() => save(true)}
                >
                    {watched ? "Save note" : "Mark Watched"}
                </button>
                <button
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                    disabled={busy}
                    onClick={() => save(false)}
                >
                    Plan to Watch
                </button>
            </div>
            <p role="status" className="text-sm text-[var(--text-secondary)]">
                {message}
            </p>
        </section>
    );
}
