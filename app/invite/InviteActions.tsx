"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { buttonClasses } from "../components/atoms";

const INVITE_TEXT = "Track tokusatsu with me on TokuDex — never lose your place again.";

export default function InviteActions({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);

    async function handleShare() {
        try {
            if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({ title: "TokuDex", text: INVITE_TEXT, url });
                track("invite_shared", { method: "webshare" });
            } else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                track("invite_shared", { method: "clipboard" });
            }
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
        }
    }

    const t = encodeURIComponent(INVITE_TEXT);
    const u = encodeURIComponent(url);

    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={handleShare}
                className={buttonClasses({ variant: "primary" })}
            >
                {copied ? "Link copied ✓" : "Copy invite link"}
            </button>
            <a
                href={`https://twitter.com/intent/tweet?text=${t}&url=${u}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("invite_shared", { method: "x" })}
                className={buttonClasses({ variant: "secondary" })}
            >
                Post on X
            </a>
            <a
                href={`https://www.reddit.com/submit?url=${u}&title=${t}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("invite_shared", { method: "reddit" })}
                className={buttonClasses({ variant: "secondary" })}
            >
                Reddit
            </a>
        </div>
    );
}
