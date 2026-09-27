import type { ReactNode } from "react";

/** 10.5px outlined tag for episode types and small qualifiers. */
export default function TagChip({
    children,
    accent = false,
    className = "",
}: {
    children: ReactNode;
    accent?: boolean;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center text-[10.5px] px-[7px] py-[2px] rounded-[5px] border whitespace-nowrap ${
                accent
                    ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    : "border-[var(--line)] text-[var(--text-secondary)]"
            } ${className}`}
        >
            {children}
        </span>
    );
}
