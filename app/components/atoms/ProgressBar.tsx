interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
    /** Track thickness. `sm` = 1.5, `md` (default) = 2. */
    size?: "sm" | "md";
    className?: string;
}

const trackHeight = { sm: "h-1.5", md: "h-2" } as const;

export default function ProgressBar({ value, max, label, size = "md", className = "" }: ProgressBarProps) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const ariaLabel = label ?? `${value} of ${max}`;

    return (
        <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
            className={`${trackHeight[size]} w-full rounded-full bg-[var(--sunk)] overflow-hidden ${className}`}
        >
            <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: "var(--accent-primary)" }}
            />
        </div>
    );
}
