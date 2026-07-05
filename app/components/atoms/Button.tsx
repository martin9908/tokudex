import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "warning";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-[var(--accent-primary)] text-[#00121b] hover:opacity-90",
    secondary:
        "border border-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]",
    ghost:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]",
    danger:
        "bg-[var(--error)] text-[#200507] hover:opacity-90",
    warning:
        "bg-[var(--warning)] text-[#1a1000] hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs min-h-[32px] rounded-lg",
    md: "px-4 py-2.5 text-sm min-h-[44px] rounded-xl",
    lg: "px-5 py-3 text-sm min-h-[56px] rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    full?: boolean;
}

export default function Button({
    variant = "primary",
    size = "md",
    full = false,
    className = "",
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            className={[
                "tdx-focus-ring inline-flex items-center justify-center font-semibold",
                "transition-[opacity,background-color,color] duration-[var(--duration-fast)]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variantClasses[variant],
                sizeClasses[size],
                full ? "w-full" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </button>
    );
}
