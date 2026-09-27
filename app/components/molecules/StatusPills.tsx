"use client";

import { STATUS_LABELS } from "@/lib/status";
import type { ProgressStatus } from "@/lib/validation";

const ORDER: ProgressStatus[] = [
    "watching",
    "completed",
    "on_hold",
    "plan_to_watch",
];

/**
 * Series status as a row of outlined pills — Watching / Done / Shelved /
 * Someday. A radio group underneath so keyboard and screen readers get the
 * real control.
 */
export default function StatusPills({
    value,
    onChange,
    name = "status",
    disabled = false,
    size = "md",
    className = "",
}: {
    value: ProgressStatus;
    onChange: (next: ProgressStatus) => void;
    name?: string;
    disabled?: boolean;
    size?: "sm" | "md";
    className?: string;
}) {
    return (
        <div
            role="radiogroup"
            aria-label="Series status"
            className={`flex flex-wrap gap-[7px] ${className}`}
        >
            {ORDER.map((key) => {
                const active = value === key;
                return (
                    <label
                        key={key}
                        className={`tdx-focus-ring relative inline-flex items-center justify-center rounded-[7px] border cursor-pointer transition-colors ${
                            size === "sm"
                                ? "px-[13px] py-[7px] text-[12px]"
                                : "px-[14px] py-[8px] text-[12.5px]"
                        } ${
                            active
                                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                : "border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        } ${disabled ? "opacity-60 cursor-default" : ""}`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={key}
                            checked={active}
                            disabled={disabled}
                            onChange={() => onChange(key)}
                            className="sr-only"
                        />
                        {STATUS_LABELS[key]}
                    </label>
                );
            })}
        </div>
    );
}
