"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMovieWatched } from "@/app/actions";
import { buttonClasses } from "../atoms";

/** One-tap "Mark watched" for a movie card — movies have no check-in screen. */
export default function MarkWatchedButton({
    seriesId,
    className,
}: {
    seriesId: string;
    className?: string;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    return (
        <button
            type="button"
            disabled={pending}
            onClick={() =>
                startTransition(async () => {
                    await setMovieWatched(seriesId, true);
                    router.refresh();
                })
            }
            className={
                className ?? buttonClasses({ variant: "secondary", size: "sm" })
            }
        >
            {pending ? "Saving…" : "Mark watched"}
        </button>
    );
}
