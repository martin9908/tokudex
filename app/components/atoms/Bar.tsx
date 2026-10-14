/** Thin 2px progress bar: sunk track, accent fill. */
export default function Bar({
    value,
    max,
    label,
    className = "",
}: {
    value: number;
    max: number;
    label?: string;
    className?: string;
}) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return (
        <div
            role={label ? "progressbar" : undefined}
            aria-label={label}
            aria-valuemin={label ? 0 : undefined}
            aria-valuemax={label ? max : undefined}
            aria-valuenow={label ? value : undefined}
            className={`h-[2px] w-full bg-[var(--sunk)] overflow-hidden ${className}`}
        >
            <div
                className="h-full bg-[var(--accent-primary)]"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}
