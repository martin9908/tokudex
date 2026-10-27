type BadgeVariant =
    | "default"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "muted";

/**
 * Small label chip. `default` is the outlined hairline tag; `accent`,
 * `success` and `warning` are tinted fills. `info`/`error` alias to the
 * accent/warning tints so older call sites keep working.
 */
const variantClasses: Record<BadgeVariant, string> = {
    default: "border border-[var(--line)] text-[var(--text-secondary)]",
    accent: "bg-[var(--accent-tint)] text-[var(--accent-on)]",
    info: "bg-[var(--accent-tint)] text-[var(--accent-on)]",
    success: "bg-[var(--success-tint)] text-[var(--success)]",
    warning: "bg-[var(--warning-tint)] text-[var(--warning)]",
    error: "bg-[var(--warning-tint)] text-[var(--warning)]",
    muted: "border border-[var(--line)] text-[var(--text-muted)]",
};

interface BadgeProps {
    variant?: BadgeVariant;
    pill?: boolean;
    className?: string;
    children: React.ReactNode;
}

export default function Badge({
    variant = "default",
    pill = false,
    className = "",
    children,
}: BadgeProps) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 whitespace-nowrap",
                pill ? "rounded-full" : "rounded-[5px]",
                variantClasses[variant],
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </span>
    );
}
