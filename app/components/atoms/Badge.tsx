type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
    default:
        "border border-[var(--line)] text-[var(--text-secondary)] bg-transparent",
    success:
        "text-[var(--success)]",
    warning:
        "text-[var(--warning)]",
    error:
        "text-[var(--error)]",
    info:
        "border border-cyan-600/30 bg-cyan-500/15 text-cyan-200",
    muted:
        "text-[var(--text-muted)]",
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
                "inline-flex items-center text-xs font-medium px-2 py-0.5",
                pill ? "rounded-full" : "rounded-md",
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
