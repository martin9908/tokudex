"use client";

import { useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { createShareCard } from "../../actions";
import { buttonClasses } from "../atoms";

type ShareButtonProps = {
    /** Earned achievement key (e.g. "series-w", "col-forever-red") or "stats". */
    shareKey: string;
    /** Coarse kind for analytics (rank/milestone/trophy/series/stats). */
    kind?: string;
    /** Button label. */
    label?: string;
    /** Text used in the tweet/native share. */
    text?: string;
    size?: "sm" | "md";
    className?: string;
};

const DEFAULT_TEXT = "Tracking my tokusatsu journey on TokuDex";

export default function ShareButton({
    shareKey,
    kind,
    label = "Share",
    text = DEFAULT_TEXT,
    size = "sm",
    className = "",
}: ShareButtonProps) {
    const [pending, startTransition] = useTransition();
    const [url, setUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyticsKind = kind ?? shareKey;

    async function ensureUrl(): Promise<string> {
        if (url) return url;
        const { slug } = await createShareCard(shareKey);
        const shareUrl = `${window.location.origin}/share/${slug}`;
        setUrl(shareUrl);
        return shareUrl;
    }

    function handleShare() {
        setError(null);
        startTransition(async () => {
            try {
                track("share_started", { kind: analyticsKind });
                const shareUrl = await ensureUrl();
                if (typeof navigator !== "undefined" && navigator.share) {
                    await navigator.share({ title: "TokuDex", text, url: shareUrl });
                    track("share_completed", { kind: analyticsKind, method: "webshare" });
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    track("share_completed", { kind: analyticsKind, method: "clipboard" });
                }
            } catch (err) {
                // User dismissed the native share sheet — not an error.
                if ((err as Error)?.name === "AbortError") return;
                setError("Couldn't share. Try again.");
            }
        });
    }

    const intentText = encodeURIComponent(text);
    const intentUrl = url ? encodeURIComponent(url) : "";

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={handleShare}
                disabled={pending}
                className={buttonClasses({ variant: "primary", size })}
            >
                {pending ? "Sharing…" : copied ? "Link copied ✓" : label}
            </button>
            {url && (
                <>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${intentText}&url=${intentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("share_completed", { kind: analyticsKind, method: "x" })}
                        className={buttonClasses({ variant: "secondary", size })}
                    >
                        Post on X
                    </a>
                    <a
                        href={`https://www.reddit.com/submit?url=${intentUrl}&title=${intentText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("share_completed", { kind: analyticsKind, method: "reddit" })}
                        className={buttonClasses({ variant: "secondary", size })}
                    >
                        Reddit
                    </a>
                </>
            )}
            {error && <span className="text-xs text-red-300">{error}</span>}
        </div>
    );
}
