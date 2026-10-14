"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { setEpisodeProgress } from "@/app/actions";

/** One-tap "log the next episode" — the plus at the end of an Also going row. */
export default function QuickLogButton({
    seriesId,
    episode,
    dim = false,
}: {
    seriesId: string;
    episode: number;
    dim?: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    return (
        <button
            type="button"
            aria-label={`Log episode ${episode}`}
            disabled={pending}
            onClick={() =>
                startTransition(async () => {
                    await setEpisodeProgress(seriesId, episode);
                    router.refresh();
                })
            }
            className={`tdx-focus-ring rounded-md min-h-[44px] min-w-[44px] grid place-items-center -mr-3 transition-colors disabled:opacity-50 ${
                dim
                    ? "text-[var(--text-muted)]"
                    : "text-[var(--accent-primary)]"
            }`}
        >
            <Plus size={17} aria-hidden />
        </button>
    );
}
