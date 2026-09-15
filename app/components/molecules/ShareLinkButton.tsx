"use client";

import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "../atoms";

/**
 * Share the current page (or a given URL) through the device share sheet,
 * falling back to copying the link. Used for "Share progress" on a title —
 * nothing private is in a title URL.
 */
export default function ShareLinkButton({
    url,
    title,
    text,
    label = "Share progress",
    variant = "secondary",
    size = "md",
    className = "",
}: {
    url?: string;
    title?: string;
    text?: string;
    label?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
}) {
    const [state, setState] = useState<"idle" | "copied" | "error">("idle");

    async function share() {
        const target = url ?? window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title, text, url: target });
            } else {
                await navigator.clipboard.writeText(target);
                setState("copied");
                setTimeout(() => setState("idle"), 2000);
            }
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            setState("error");
        }
    }

    return (
        <button
            type="button"
            onClick={share}
            className={buttonClasses({ variant, size, className })}
        >
            <ShareNetwork size={14} aria-hidden />
            {state === "copied"
                ? "Link copied"
                : state === "error"
                  ? "Couldn't share"
                  : label}
        </button>
    );
}
