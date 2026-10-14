"use client";

import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordStrength } from "@/lib/validation";
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

        const pwError = validatePasswordStrength(password);
        if (pwError) {
            setError(pwError);
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

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
                <label htmlFor={pwId} className="tdx-label">
                    New password{" "}
                    <span className="tdx-label-hint">at least 8 characters</span>
                </label>
                <input
                    id={pwId}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="tdx-field"
                    placeholder="••••••••"
                />
            </div>
            <div>
                <label htmlFor={confirmId} className="tdx-label">
                    Confirm new password
                </label>
                <input
                    id={confirmId}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="tdx-field"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <p role="alert" className="text-xs text-[var(--warning)]">
                    {error}
                </p>
            )}
            {done && (
                <p role="status" className="text-xs text-[var(--success)]">
                    Password updated.
                </p>
            )}

            <button
                type="submit"
                disabled={saving}
                className={buttonClasses({ className: "self-start" })}
            >
                {saving ? "Saving…" : "Update password"}
            </button>
        </form>
    );
}
