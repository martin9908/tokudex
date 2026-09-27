"use client";

import { useState, useTransition } from "react";
import { setWeeklyRecap } from "../actions";

function Toggle({
    on,
    disabled,
    onChange,
    label,
}: {
    on: boolean;
    disabled?: boolean;
    onChange?: (next: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange?.(!on)}
            className={`tdx-focus-ring relative flex-none w-[38px] h-[22px] rounded-full transition-colors disabled:cursor-default ${
                on
                    ? "bg-[var(--accent-primary)]"
                    : "bg-[var(--sunk)] border border-[var(--line)]"
            }`}
        >
            <span
                className={`absolute top-[2px] w-[17px] h-[17px] rounded-full transition-[left] ${
                    on
                        ? "left-[18px] bg-[var(--accent-on)]"
                        : "left-[2px] bg-[var(--text-muted)]"
                }`}
            />
        </button>
    );
}

/** In-app, and by email — the three switches from the notifications sheet. */
export default function NotificationPrefs({ weeklyRecap }: { weeklyRecap: boolean }) {
    const [recap, setRecap] = useState(weeklyRecap);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function change(next: boolean) {
        const previous = recap;
        setRecap(next);
        setError(null);
        startTransition(async () => {
            try {
                await setWeeklyRecap(next);
            } catch (e) {
                setRecap(previous);
                setError(e instanceof Error ? e.message : "Could not save.");
            }
        });
    }

    const rows = [
        {
            title: "Submission decisions",
            body: "Published, rejected, corrected",
            control: <Toggle on disabled label="Submission decisions — always on" />,
        },
        {
            title: "Badges and rank-ups",
            body: "In-app only by default",
            control: <Toggle on={false} disabled label="Badges and rank-ups — in-app only" />,
        },
        {
            title: "Weekly recap email",
            body: recap
                ? "What you logged, what you're near — starts with the first recap"
                : "What you logged, what you're near",
            control: (
                <Toggle on={recap} disabled={pending} onChange={change} label="Weekly recap email" />
            ),
        },
    ];

    return (
        <section className="rounded-lg border border-[var(--line)] p-5 md:p-6">
            <p className="text-[12.5px] text-[var(--text-secondary)]">In-app, and by email</p>
            <div className="flex flex-col gap-2.5 mt-[13px]">
                {rows.map((r) => (
                    <div
                        key={r.title}
                        className="flex items-center gap-3 px-[13px] py-3 rounded-lg border border-[var(--line)]"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px]">{r.title}</p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{r.body}</p>
                        </div>
                        {r.control}
                    </div>
                ))}
            </div>
            {error && <p className="text-[11.5px] text-[var(--warning)] mt-2">{error}</p>}
        </section>
    );
}
