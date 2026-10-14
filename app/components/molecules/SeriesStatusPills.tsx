"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSeriesStatus } from "@/app/actions";
import type { ProgressStatus } from "@/lib/validation";
import StatusPills from "./StatusPills";

/** The status pill row on a series page — saves on tap, keeps the episode. */
export default function SeriesStatusPills({
    seriesId,
    currentEpisode,
    status,
    size = "md",
    className = "",
}: {
    seriesId: string;
    currentEpisode: number;
    status: ProgressStatus;
    size?: "sm" | "md";
    className?: string;
}) {
    const router = useRouter();
    const [value, setValue] = useState<ProgressStatus>(status);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function change(next: ProgressStatus) {
        const previous = value;
        setValue(next);
        setError(null);
        startTransition(async () => {
            try {
                await setSeriesStatus(seriesId, currentEpisode, next);
                router.refresh();
            } catch {
                setValue(previous);
                setError("That didn't save. Try again.");
            }
        });
    }

    return (
        <div className={className}>
            <StatusPills
                value={value}
                onChange={change}
                disabled={pending}
                size={size}
            />
            {error && (
                <p className="text-[11.5px] text-[var(--warning)] mt-2">{error}</p>
            )}
        </div>
    );
}
