interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
    /** Track thickness: `xs` = 2px, `sm` = 3px (default), `md` = 4px. */
    size?: "xs" | "sm" | "md";
    /** Render the fill in the muted colour (on-hold, locked). */
    muted?: boolean;
    className?: string;
}

const trackHeight = { xs: "h-[2px]", sm: "h-[3px]", md: "h-1" } as const;

export default function ProgressBar({
    value,
    max,
    label,
    size = "sm",
    muted = false,
    className = "",
}: ProgressBarProps) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const ariaLabel = label ?? `${value} of ${max}`;

    return (
        <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
            className={`${trackHeight[size]} w-full rounded-[2px] bg-[var(--sunk)] overflow-hidden ${className}`}
        >
            <div
                className="h-full transition-[width] duration-[var(--duration-normal)]"
                style={{
                    width: `${pct}%`,
                    background: muted
                        ? "var(--text-muted)"
                        : "var(--accent-primary)",
                }}
            />
        </div>
    );
}
