"use client";

import { useEffect, useState } from "react";
import { SealCheck } from "@phosphor-icons/react";
import ShareButton from "../molecules/ShareButton";
import { buttonClasses } from "../atoms";

const STORAGE_KEY = "tokudex.earnedAchievements";

type Toast = { id: number; text: string; achievementKey: string };

export default function AchievementToaster({
    earned,
    labels,
}: {
    earned: string[];
    labels: Record<string, string>;
}) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const earnedKey = earned.join("|");

    useEffect(() => {
        let stored: string[] | null = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            stored = raw ? (JSON.parse(raw) as string[]) : null;
        } catch {
            stored = null;
        }

        if (stored === null) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
            } catch { }
            return;
        }

        const storedSet = new Set(stored);
        const fresh = earned.filter((k) => !storedSet.has(k));

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
        } catch { }

        if (fresh.length) {
            const base = Date.now();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setToasts((prev) => [
                ...prev,
                ...fresh.map((k, i) => ({ id: base + i, text: labels[k] ?? k, achievementKey: k })),
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
        // Longer than the plain toast so there's time to hit Share.
        const timer = setTimeout(onDone, 10000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            role="status"
            className="pointer-events-auto w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3.5 text-left shadow-[0_10px_40px_var(--shade)]"
        >
            <p className="tdx-eyebrow">Badge unlocked</p>
            <div className="mt-2.5 p-4 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent-primary)] text-center">
                <SealCheck size={30} weight="fill" className="mx-auto text-[var(--accent-on)]" aria-hidden />
                <p className="text-[15px] font-medium text-[var(--accent-on)] mt-2">{toast.text}</p>
            </div>
            <div className="flex gap-2 mt-3">
                <ShareButton
                    shareKey={toast.achievementKey}
                    size="md"
                    text={`I unlocked "${toast.text}" on TokuDex!`}
                    className="flex-1 [&>button]:w-full"
                />
                <button
                    type="button"
                    onClick={onDone}
                    className={buttonClasses({ variant: "secondary", className: "flex-1" })}
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
