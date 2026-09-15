"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
    const [message, setMessage] = useState("");
    const router = useRouter();
    return (
        <form
            className={className}
            action={async (data) => {
                setBusy(true);
                setMessage("");
                try {
                    await action(data);
                    setMessage("Saved.");
                    router.refresh();
                } catch (e) {
                    setMessage(
                        e instanceof Error ? e.message : "Could not save.",
                    );
                } finally {
                    setBusy(false);
                }
            }}
        >
            <fieldset disabled={busy} className="space-y-3">
                {children}
            </fieldset>
            <p role="status" aria-live="polite">
                {busy ? "Saving…" : message}
            </p>
        </form>
    );
}
