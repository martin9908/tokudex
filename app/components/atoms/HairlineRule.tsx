/** A 1px rule that fades out at both ends — the canvas's section divider. */
export default function HairlineRule({
    inset = 48,
    className = "",
}: {
    inset?: number;
    className?: string;
}) {
    return (
        <div
            aria-hidden
            className={`h-px ${className}`}
            style={{
                background: `linear-gradient(90deg, transparent, var(--line) ${inset}px, var(--line) calc(100% - ${inset}px), transparent)`,
            }}
        />
    );
}
