"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "../actions";
import { buttonClasses } from "../components/atoms";

export default function DeleteAccountButton() {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [text, setText] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setError(null);
        setPending(true);
        try {
            await deleteAccount();
            // Session is now invalid — clear local cookies and leave.
            await createClient().auth.signOut();
            router.push("/login");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete account.");
            setPending(false);
        }
    }

    if (!confirming) {
        return (
            <button
                type="button"
                onClick={() => setConfirming(true)}
                className={buttonClasses({ variant: "danger" })}
            >
                Delete account
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <label className="tdx-label text-[var(--warning)]">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm.
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoFocus
                    className="tdx-field tdx-field-sunk mt-1.5 border-[var(--warning)] focus:border-[var(--warning)]"
                />
            </label>

            {error && (
                <p role="alert" className="text-xs text-[var(--warning)]">
                    {error}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setConfirming(false);
                        setText("");
                        setError(null);
                    }}
                    disabled={pending}
                    className={buttonClasses({ variant: "secondary" })}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={text !== "DELETE" || pending}
                    className={buttonClasses({ variant: "danger" })}
                >
                    {pending ? "Deleting…" : "Permanently delete"}
                </button>
            </div>
        </div>
    );
}
