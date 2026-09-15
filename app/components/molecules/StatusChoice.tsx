"use client";

export type ProgressStatus =
    | "watching"
    | "completed"
    | "on_hold"
    | "plan_to_watch";

export const STATUS_LABELS: Record<ProgressStatus, string> = {
    watching: "Watching",
    completed: "Completed",
    on_hold: "On hold",
    plan_to_watch: "Plan to watch",
};

const ORDER: ProgressStatus[] = [
    "watching",
    "completed",
    "on_hold",
    "plan_to_watch",
];

/**
 * Series status as a grid of choice tiles — a radio group drawn as boxes so
 * the current state reads at a glance and every option is a 44px target.
 */
export default function StatusChoice({
    value,
    onChange,
    columns = 4,
    name = "status",
    disabled = false,
}: {
    value: ProgressStatus;
    onChange: (next: ProgressStatus) => void;
    columns?: 2 | 4;
    name?: string;
    disabled?: boolean;
}) {
    return (
        <div
            role="radiogroup"
            className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}
        >
            {ORDER.map((key) => (
                <label
                    key={key}
                    className={`tdx-choice min-h-[40px] text-[13px] ${value === key ? "is-active" : ""} ${disabled ? "opacity-60 cursor-default" : ""}`}
                >
                    <input
                        type="radio"
                        name={name}
                        value={key}
                        checked={value === key}
                        disabled={disabled}
                        onChange={() => onChange(key)}
                        className="sr-only"
                    />
                    {STATUS_LABELS[key]}
                </label>
            ))}
        </div>
    );
}
