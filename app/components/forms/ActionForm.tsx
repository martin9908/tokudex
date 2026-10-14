"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Thin wrapper for server-action forms: disables the fields while the action
 * runs and reports the outcome inline instead of navigating away.
 */
export default function ActionForm({
    action,
    children,
    className = "space-y-3",
}: {
    action: (data: FormData) => Promise<void>;
    children: React.ReactNode;
    className?: string;
}) {
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
        null,
    );
    const router = useRouter();
    return (
        <form
            className={className}
            action={async (data) => {
                setBusy(true);
                setMessage(null);
                try {
                    await action(data);
                    setMessage({ ok: true, text: "Saved." });
                    router.refresh();
                } catch (e) {
                    setMessage({
                        ok: false,
                        text: e instanceof Error ? e.message : "Could not save.",
                    });
                } finally {
                    setBusy(false);
                }
            }}
        >
            <fieldset disabled={busy} className="contents">
                {children}
            </fieldset>
            <p
                role="status"
                aria-live="polite"
                className={`text-xs mt-1.5 empty:hidden ${
                    message && !message.ok
                        ? "text-[var(--warning)]"
                        : "text-[var(--text-secondary)]"
                }`}
            >
                {busy ? "Saving…" : message?.text}
            </p>
        </form>
    );
}
