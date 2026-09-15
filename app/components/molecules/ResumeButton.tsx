"use client";

import { useTransition } from "react";
import { setSeriesStatus } from "@/app/actions";

export default function ResumeButton({
    seriesId,
    currentEpisode,
    className = "",
}: {
    seriesId: string;
    currentEpisode: number;
    className?: string;
}) {
    const [pending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            await setSeriesStatus(seriesId, currentEpisode, "watching");
        });
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className={className}
        >
            {pending ? "Resuming…" : "Resume"}
        </button>
    );
}
