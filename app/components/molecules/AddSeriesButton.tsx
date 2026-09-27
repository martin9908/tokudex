"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { addSeriesToTracker } from "../../actions";
import { buttonClasses } from "../atoms";

type AddSeriesButtonProps = {
    seriesId: string;
    className?: string;
};

export default function AddSeriesButton({
    seriesId,
    className = "",
}: AddSeriesButtonProps) {
    const router = useRouter();
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleClick() {
        setError(null);
        startTransition(async () => {
            try {
                await addSeriesToTracker(seriesId);
                setAdded(true);
                router.refresh();
            } catch {
                setError("Could not add this title. Please try again.");
            }
        });
    }

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleClick}
                disabled={pending || added}
                className={buttonClasses()}
            >
                <Plus size={14} aria-hidden />
                {added ? "In your dex" : pending ? "Adding…" : "Start tracking"}
            </button>
            {error && (
                <p role="alert" className="mt-2 text-xs text-[var(--warning)]">
                    {error}
                </p>
            )}
        </div>
    );
}
