"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "../actions";
import { buttonClasses } from "../components/atoms";

/** Public handle + the switch that puts your logging in the community feed. */
export default function ProfileForm({
    initialHandle,
    initialShare,
}: {
    initialHandle: string;
    initialShare: boolean;
}) {
    const router = useRouter();
    const id = useId();
    const [handle, setHandle] = useState(initialHandle);
    const [share, setShare] = useState(initialShare);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function submit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setDone(false);
        startTransition(async () => {
            try {
                await saveProfile({ handle, shareActivity: share });
                setDone(true);
                router.refresh();
            } catch (e) {
                setError(e instanceof Error ? e.message : "Could not save.");
            }
        });
    }

    return (
        <form onSubmit={submit} className="mt-4">
            <label htmlFor={id} className="tdx-label">
                Handle{" "}
                <span className="tdx-label-hint">
                    shown in Community as @{handle || "…"}
                </span>
            </label>
            <div className="flex flex-wrap gap-2">
                <div className="tdx-field flex items-center gap-1 flex-1 min-w-[180px] py-0">
                    <span className="text-[var(--text-muted)]">@</span>
                    <input
                        id={id}
                        type="text"
                        value={handle}
                        maxLength={20}
                        pattern="[a-z0-9_]{3,20}"
                        onChange={(e) => {
                            setHandle(e.target.value.toLowerCase());
                            setDone(false);
                        }}
                        placeholder="hoshino"
                        className="flex-1 min-w-0 bg-transparent outline-none py-[9px]"
                    />
                </div>
                <button
                    type="submit"
                    disabled={pending}
                    className={buttonClasses({ variant: "secondary" })}
                >
                    {pending ? "Saving…" : "Save"}
                </button>
            </div>
            <label className="tdx-switch mt-3.5 text-[12.5px]">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={share}
                    onChange={(e) => {
                        setShare(e.target.checked);
                        setDone(false);
                    }}
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
                <p className="text-[11.5px] text-[var(--success)] mt-2">Saved.</p>
            )}
        </form>
    );
}
