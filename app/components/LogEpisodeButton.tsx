"use client";

import { useState } from "react";
import EpisodeCheckInModal from "./EpisodeCheckInModal";

type LogEpisodeButtonProps = {
    seriesId: string;
    seriesTitle: string;
    episodeNumber: number;
    episodeTitle?: string | null;
    episodeSynopsis?: string | null;
    className?: string;
    label?: string;
};

export default function LogEpisodeButton({
    seriesId,
    seriesTitle,
    episodeNumber,
    episodeTitle,
    episodeSynopsis,
    className,
    label,
}: LogEpisodeButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={className}
            >
                {label ?? `Log Episode ${episodeNumber}`}
            </button>
            {open && (
                <EpisodeCheckInModal
                    open
                    seriesId={seriesId}
                    seriesTitle={seriesTitle}
                    episodeNumber={episodeNumber}
                    episodeTitle={episodeTitle}
                    episodeSynopsis={episodeSynopsis}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}