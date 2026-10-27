"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveShareActivity } from "../actions";

/** The switch that puts your logging in the community feed. Saves on change. */
export default function ShareActivityToggle({ initialShare }: { initialShare: boolean }) {
    const router = useRouter();
    const [share, setShare] = useState(initialShare);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function change(next: boolean) {
        const previous = share;
        setShare(next);
        setError(null);
        setDone(false);
        startTransition(async () => {
            try {
                await saveShareActivity(next);
                setDone(true);
                router.refresh();
            } catch (e) {
                setShare(previous);
                setError(e instanceof Error ? e.message : "Could not save.");
            }
        });
    }

    return (
        <div>
            <label className="tdx-switch text-[13px] text-[var(--text-primary)]">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={share}
                    disabled={pending}
                    onChange={(e) => change(e.target.checked)}
                />
                <span className="tdx-switch-knob" aria-hidden />
                Show what I log in Community
            </label>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-[1.5]">
                Only the title and episode number — never notes, never ratings.
                Off, and nothing you log leaves your dex.
            </p>
            {error && (
                <p role="alert" className="text-[11.5px] text-[var(--warning)] mt-2">
                    {error}
                </p>
            )}
            {done && !error && (
                <p className="text-[11.5px] text-[var(--success)] mt-2">
                    {share ? "Sharing on." : "Sharing off."}
                </p>
            )}
        </div>
    );
}
