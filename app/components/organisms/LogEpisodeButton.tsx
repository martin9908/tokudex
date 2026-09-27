"use client";

import { useState } from "react";
import EpisodeCheckInModal from "./EpisodeCheckInModal";
import type { ProgressStatus } from "@/lib/validation";

type LogEpisodeButtonProps = {
    seriesId: string;
    seriesTitle: string;
    episodeNumber: number;
    episodeTitle?: string | null;
    episodeSynopsis?: string | null;
    episodeType?: string | null;
    totalEpisodes?: number | null;
    initialStatus?: ProgressStatus;
    initialNote?: string;
    episodesLogged?: number | null;
    className?: string;
    label?: string;
};

export default function LogEpisodeButton({
    seriesId,
    seriesTitle,
    episodeNumber,
    episodeTitle,
    episodeSynopsis,
    episodeType,
    totalEpisodes,
    initialStatus,
    initialNote,
    episodesLogged,
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
                {label ?? `Log ${episodeNumber}`}
            </button>
            {open && (
                <EpisodeCheckInModal
                    open
                    seriesId={seriesId}
                    seriesTitle={seriesTitle}
                    episodeNumber={episodeNumber}
                    episodeTitle={episodeTitle}
                    episodeSynopsis={episodeSynopsis}
                    episodeType={episodeType}
                    totalEpisodes={totalEpisodes}
                    initialStatus={initialStatus}
                    initialNote={initialNote}
                    episodesLogged={episodesLogged}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
