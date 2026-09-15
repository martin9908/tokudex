"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEpisodeProgress } from "@/app/actions";
import { buttonClasses } from "../atoms";

/** "Mark all watched" with an inline confirm — it's the one bulk action. */
export default function MarkAllButton({
    seriesId,
    totalEpisodes,
}: {
    seriesId: string;
    totalEpisodes: number;
}) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function markAll() {
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, totalEpisodes);
                setConfirming(false);
                router.refresh();
            } catch {
                setError("That didn't save. Try again.");
            }
        });
    }

    if (confirming) {
        return (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--warning)] bg-[var(--warning-tint)] px-2.5 py-1 text-xs text-[var(--warning)]">
                Mark all {totalEpisodes} watched?
                <button
                    type="button"
                    onClick={markAll}
                    disabled={pending}
                    className="tdx-focus-ring font-medium underline underline-offset-2 rounded"
                >
                    {pending ? "Saving…" : "Confirm"}
                </button>
                <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={pending}
                    className="tdx-focus-ring opacity-80 rounded"
                >
                    Cancel
                </button>
                {error && <span>{error}</span>}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setConfirming(true)}
            className={buttonClasses({ variant: "secondary" })}
        >
            Mark all watched
        </button>
    );
}
