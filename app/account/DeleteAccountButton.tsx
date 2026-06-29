"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "../actions";

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
                className="tdx-focus-ring inline-flex min-h-[44px] items-center rounded-xl border border-red-500/50 px-4 text-sm font-semibold text-red-200 hover:bg-red-500/10 transition-colors"
            >
                Delete account
            </button>
        );
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm text-cyan-100/90">
                Type <span className="font-mono font-semibold text-red-200">DELETE</span> to confirm.
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoFocus
                    className="mt-2 min-h-[44px] w-full rounded-xl border border-red-900/50 bg-[#06111d]/90 px-3 text-sm text-cyan-50 outline-none focus:ring-2 focus:ring-red-500/60"
                />
            </label>

            {error && (
                <p role="alert" className="text-sm text-red-300">
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
                    className="tdx-focus-ring inline-flex min-h-[44px] items-center rounded-xl border border-cyan-900/60 px-4 text-sm font-medium text-cyan-100 hover:bg-cyan-500/10 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={text !== "DELETE" || pending}
                    className="tdx-focus-ring inline-flex min-h-[44px] items-center rounded-xl bg-red-500/90 px-4 text-sm font-semibold text-[#1a0406] hover:bg-red-400 disabled:opacity-40 transition-colors"
                >
                    {pending ? "Deleting…" : "Permanently delete"}
                </button>
            </div>
        </div>
    );
}
