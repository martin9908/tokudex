import type { ReactNode } from "react";

export type NumberTone = "text" | "mute" | "dim" | "accent";

const TONES: Record<NumberTone, string> = {
    text: "text-[var(--text-primary)]",
    mute: "text-[var(--text-secondary)]",
    dim: "text-[var(--text-muted)]",
    accent: "text-[var(--accent-primary)]",
};

/**
 * The redesign's big tabular numeral — episode numbers, counts, ranks. Tight
 * tracking and a .82 line-height so it sits on the baseline of the text beside it.
 */
export default function BigNumber({
    children,
    size = 30,
    tone = "text",
    className = "",
}: {
    children: ReactNode;
    size?: number;
    tone?: NumberTone;
    className?: string;
}) {
    return (
        <span
            className={`font-medium tabular-nums leading-[0.82] tracking-[-0.04em] ${TONES[tone]} ${className}`}
            style={{ fontSize: size }}
        >
            {children}
        </span>
    );
}
