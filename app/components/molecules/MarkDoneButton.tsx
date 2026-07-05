"use client";

import { useState, useTransition } from "react";
import { setEpisodeProgress } from "../../actions";
import { buttonClasses } from "../atoms";

type MarkDoneButtonProps = {
    seriesId: string;
    /** Total episodes — marking done sets progress to this (status → completed). */
    totalEpisodes: number;
    className?: string;
};

export default function MarkDoneButton({ seriesId, totalEpisodes, className = "" }: MarkDoneButtonProps) {
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleClick(event: React.MouseEvent) {
        // Sits inside a stretched-link card — don't let the click navigate.
        event.preventDefault();
        event.stopPropagation();
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(seriesId, totalEpisodes);
                setDone(true);
            } catch {
                setError("Couldn't update. Try again.");
            }
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                disabled={pending || done}
                aria-busy={pending}
                className={buttonClasses({
                    variant: done ? "secondary" : "primary",
                    size: "sm",
                    full: true,
                    className: `relative z-10 ${className}`,
                })}
            >
                {done ? "Marked as done ✓" : pending ? "Marking…" : "Mark as done"}
            </button>
            {error && <p className="relative z-10 mt-1 text-xs text-red-300">{error}</p>}
        </>
    );
}
