"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tokudex.earnedAchievements";

type Toast = { id: number; text: string };

export default function AchievementToaster({
    earned,
    labels,
}: {
    earned: string[];
    labels: Record<string, string>;
}) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    // Depend on a stable string so the effect only reacts to real changes.
    const earnedKey = earned.join("|");

    useEffect(() => {
        let stored: string[] | null = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            stored = raw ? (JSON.parse(raw) as string[]) : null;
        } catch {
            stored = null;
        }

        // First load on this device: seed silently so we don't toast everything
        // the user already earned before this feature existed.
        if (stored === null) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
            } catch {}
            return;
        }

        const storedSet = new Set(stored);
        const fresh = earned.filter((k) => !storedSet.has(k));

        // Persist the current set either way (also drops un-earned keys so they
        // can toast again if re-earned).
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
        } catch {}

        if (fresh.length) {
            const base = Date.now();
            // Queuing toasts is the intended response to new server data detected
            // via the localStorage diff (which can only run in an effect).
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setToasts((prev) => [
                ...prev,
                ...fresh.map((k, i) => ({ id: base + i, text: labels[k] ?? k })),
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [earnedKey]);

    function dismiss(id: number) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    if (!toasts.length) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
            {toasts.map((t) => (
                <AchievementToast key={t.id} toast={t} onDone={() => dismiss(t.id)} />
            ))}
        </div>
    );
}

function AchievementToast({ toast, onDone }: { toast: Toast; onDone: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onDone, 5000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <button
            type="button"
            onClick={onDone}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-amber-400/45 bg-[#12202f] px-4 py-3 text-left shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        >
            <span className="text-xl" aria-hidden>
                🏆
            </span>
            <span>
                <span className="block text-[11px] uppercase tracking-wider text-amber-300/80">
                    Achievement unlocked
                </span>
                <span className="block text-sm font-semibold text-cyan-50">{toast.text}</span>
            </span>
        </button>
    );
}
