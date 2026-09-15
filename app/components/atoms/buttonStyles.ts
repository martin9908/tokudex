export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "warning";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Nocturne buttons are flat and outlined: the primary action carries the
 * accent as text + border and tints on hover; secondary uses the hairline;
 * ghost has no border at all. Danger/warning share the warning hue — the
 * palette has no separate red for errors.
 */
const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-tint)]",
    secondary:
        "border border-[var(--line)] text-[var(--text-primary)] hover:bg-[var(--sunk)]",
    ghost: "border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sunk)]",
    danger: "border border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning-tint)]",
    warning:
        "border border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning-tint)]",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-2.5 py-[5px] text-[12.5px] min-h-[30px] rounded-lg",
    md: "px-3 py-[7px] text-sm min-h-[36px] rounded-lg",
    lg: "px-4 py-2.5 text-sm min-h-[48px] rounded-lg",
};

interface ButtonClassOptions {
    variant?: ButtonVariant;
    size?: ButtonSize;
    full?: boolean;
    className?: string;
}

/**
 * Single source of truth for button/link styling. Shared by the `Button` and
 * `LinkButton` atoms and by any component that needs a button-shaped className
 * (e.g. `LogEpisodeButton`).
 */
export function buttonClasses({
    variant = "primary",
    size = "md",
    full = false,
    className = "",
}: ButtonClassOptions = {}): string {
    return [
        "tdx-focus-ring inline-flex items-center justify-center gap-1.5 font-medium leading-tight whitespace-nowrap cursor-pointer",
        "transition-[background-color,color,border-color] duration-[var(--duration-fast)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        full ? "w-full" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");
}
