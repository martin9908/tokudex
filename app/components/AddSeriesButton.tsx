"use client";

import { useState, useTransition } from "react";
import { addSeriesToTracker } from "../actions";

type AddSeriesButtonProps = {
    seriesId: string;
    className?: string;
};

export default function AddSeriesButton({ seriesId, className = "" }: AddSeriesButtonProps) {
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleClick() {
        setError(null);
        startTransition(async () => {
            try {
                await addSeriesToTracker(seriesId);
                setAdded(true);
            } catch {
                setError("Could not add series. Please try again.");
            }
        });
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={pending || added}
                className={`inline-flex w-full justify-center rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-[#031018] px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${className}`}
            >
                {added ? "Added to Tracker" : pending ? "Adding…" : "+ Add to My Tracker"}
            </button>
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
    );
}
