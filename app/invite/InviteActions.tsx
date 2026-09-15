"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { Copy, ShareNetwork } from "@phosphor-icons/react";
import { buttonClasses } from "../components/atoms";

const INVITE_TEXT = "Track tokusatsu with me on TokuDex — never lose your place again.";

export default function InviteActions({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            track("invite_shared", { method: "clipboard" });
        } catch {
            // Clipboard blocked — the link is selectable above.
        }
    }

    async function share() {
        try {
            if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({ title: "TokuDex", text: INVITE_TEXT, url });
                track("invite_shared", { method: "webshare" });
            } else {
                await copy();
            }
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
        }
    }

    const t = encodeURIComponent(INVITE_TEXT);
    const u = encodeURIComponent(url);

    return (
        <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={buttonClasses()}>
                <Copy size={14} aria-hidden />
                {copied ? "Link copied" : "Copy link"}
            </button>
            <button
                type="button"
                onClick={share}
                className={buttonClasses({ variant: "secondary" })}
            >
                <ShareNetwork size={14} aria-hidden />
                Share
            </button>
            <a
                href={`https://twitter.com/intent/tweet?text=${t}&url=${u}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("invite_shared", { method: "x" })}
                className={buttonClasses({ variant: "ghost" })}
            >
                Post on X
            </a>
            <a
                href={`https://www.reddit.com/submit?url=${u}&title=${t}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("invite_shared", { method: "reddit" })}
                className={buttonClasses({ variant: "ghost" })}
            >
                Reddit
            </a>
        </div>
    );
}
