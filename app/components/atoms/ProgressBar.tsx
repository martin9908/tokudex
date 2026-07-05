interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
    className?: string;
}

export default function ProgressBar({ value, max, label, className = "" }: ProgressBarProps) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const ariaLabel = label ?? `${value} of ${max}`;

    return (
        <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
            className={`h-2 w-full rounded-full bg-cyan-950/75 overflow-hidden ${className}`}
        >
            <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: "var(--accent-primary)" }}
            />
        </div>
    );
}
