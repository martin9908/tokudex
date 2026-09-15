"use client";

import { useState } from "react";
import { THEME_COOKIE, parseTheme, type ThemeChoice } from "@/lib/theme";

const CHOICES: { value: ThemeChoice; label: string }[] = [
    { value: "dark", label: "Slate" },
    { value: "light", label: "Paper" },
];

/** Stamp the choice on <html> and persist it for the server to read. */
function applyTheme(next: ThemeChoice) {
    const root = document.documentElement;
    if (next === "system") {
        delete root.dataset.theme;
        document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    } else {
        root.dataset.theme = next;
        document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    }
}

/**
 * Segmented Slate / Paper picker. Writes the cookie the root layout reads and
 * flips `data-theme` immediately so there's no reload. Slate is the default.
 */
export default function ThemeToggle({
    initial,
    className = "",
}: {
    /** The server-read cookie value, so the first paint matches. */
    initial: string | undefined;
    className?: string;
}) {
    const [choice, setChoice] = useState<ThemeChoice>(
        parseTheme(initial) ?? "dark",
    );

    function select(next: ThemeChoice) {
        setChoice(next);
        applyTheme(next);
    }

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className={`tdx-seg tdx-seg-sm ${className}`}
        >
            {CHOICES.map((c) => (
                <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={choice === c.value}
                    className={`tdx-focus-ring ${choice === c.value ? "is-active" : ""}`}
                    onClick={() => select(c.value)}
                >
                    {c.label}
                </button>
            ))}
        </div>
    );
}
