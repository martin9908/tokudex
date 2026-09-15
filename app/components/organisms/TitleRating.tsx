"use client";
import { useState } from "react";
import { LockSimple } from "@phosphor-icons/react";
import { rateTitle } from "@/app/community/actions";
import { buttonClasses } from "@/app/components/atoms";
export default function TitleRating({
    id,
    initialScore,
    eligible,
}: {
    id: string;
    initialScore: number | null;
    eligible: boolean;
}) {
    const [score, setScore] = useState(String(initialScore ?? 8));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function save(value: number | null) {
        setBusy(true);
        setError("");
        try {
            await rateTitle(id, value);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save rating.");
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="space-y-2">
            {eligible ? (
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm text-[var(--text-secondary)]">
                        Your rating{" "}
                        <select
                            aria-label="Your rating"
                            className="tdx-field p-2 inline-block w-auto text-[var(--text-primary)]"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                        >
                            {Array.from({ length: 10 }, (_, i) => (
                                <option key={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </label>
                    <button
                        className={buttonClasses({ variant: "secondary", size: "sm" })}
                        disabled={busy}
                        onClick={() => save(Number(score))}
                    >
                        Save rating
                    </button>
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-[var(--line)] p-3.5 flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                    <LockSimple size={16} className="text-[var(--text-muted)]" />
                    Start this series or mark this movie watched to rate it.
                </div>
            )}
            {initialScore !== null && (
                <div className="text-sm text-[var(--text-secondary)]">
                    <p>
                        Your saved score: {initialScore}/10
                        {!eligible ? " (excluded until you watch again)" : ""}
                    </p>
                    <button
                        className="tdx-focus-ring underline text-[var(--accent-primary)]"
                        disabled={busy}
                        onClick={() => save(null)}
                    >
                        Remove rating
                    </button>
                </div>
            )}
            <p role="status" className="text-sm text-[var(--warning)]">
                {error}
            </p>
        </div>
    );
}
