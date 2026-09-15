"use client";

import { useState, useTransition } from "react";
import { setSeriesStatus } from "@/app/actions";
import type { ProgressStatus } from "@/lib/validation";

const STATUS_LABELS: Record<ProgressStatus, string> = {
    watching: "Watching",
    completed: "Completed",
    on_hold: "On hold",
    plan_to_watch: "Plan to watch",
};

export default function ChangeStatusSelect({
    seriesId,
    currentEpisode,
    status,
    className = "",
}: {
    seriesId: string;
    currentEpisode: number;
    status: ProgressStatus;
    className?: string;
}) {
    const [value, setValue] = useState(status);
    const [pending, startTransition] = useTransition();

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const next = e.target.value as ProgressStatus;
        setValue(next);
        startTransition(async () => {
            await setSeriesStatus(seriesId, currentEpisode, next);
        });
    }

    return (
        <select
            aria-label="Change status"
            value={value}
            onChange={handleChange}
            disabled={pending}
            className={`tdx-focus-ring bg-transparent text-[var(--accent-primary)] outline-none cursor-pointer disabled:opacity-50 ${className}`}
        >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option
                    key={key}
                    value={key}
                    className="bg-[var(--surface)] text-[var(--text-primary)]"
                >
                    {label}
                </option>
            ))}
        </select>
    );
}
