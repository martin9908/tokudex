"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "../actions";
import { buttonClasses } from "../components/atoms";

/** Public handle. Sharing has its own switch (ShareActivityToggle). */
export default function ProfileForm({
    initialHandle,
    share,
}: {
    initialHandle: string;
    /** Current sharing setting, passed through unchanged when the handle saves. */
    share: boolean;
}) {
    const router = useRouter();
    const id = useId();
    const [handle, setHandle] = useState(initialHandle);
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
