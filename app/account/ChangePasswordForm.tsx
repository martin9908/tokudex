"use client";

import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "../components/atoms";

export default function ChangePasswordForm() {
    const pwId = useId();
    const confirmId = useId();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setDone(false);

        if (password.length < 8) {
            setError("Use at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }

        setSaving(true);
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setSaving(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }
        setPassword("");
        setConfirm("");
        setDone(true);
    }

    const inputClass = "min-h-[44px] tdx-field px-3";

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-1.5">
                <label htmlFor={pwId} className="text-sm font-medium text-cyan-100/90">
                    New password
                </label>
                <input
                    id={pwId}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor={confirmId} className="text-sm font-medium text-cyan-100/90">
                    Confirm new password
                </label>
                <input
                    id={confirmId}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-300">
                    {error}
                </p>
            )}
            {done && (
                <p role="status" className="text-sm text-emerald-300">
                    Password updated.
                </p>
            )}

            <button
                type="submit"
                disabled={saving}
                className={buttonClasses({ variant: "primary", className: "px-5" })}
            >
                {saving ? "Saving…" : "Update password"}
            </button>
        </form>
    );
}
