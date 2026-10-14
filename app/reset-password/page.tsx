"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "../components/atoms";

export default function ResetPasswordPage() {
    const router = useRouter();
    const pwId = useId();
    const confirmId = useId();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);

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

        if (updateError) {
            setError(updateError.message);
            setSaving(false);
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16 pb-24">
            <div className="w-full max-w-[372px] tdx-panel p-6">
                <p className="tdx-eyebrow">Reset password</p>
                <h1 className="text-[17px] font-medium mt-1.5">Set a new password</h1>
                <p className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)] mt-2 mb-4">
                    You opened this from the reset link in your email.
                </p>
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
                        <p role="alert" className="tdx-callout tdx-callout-warn text-xs">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className={buttonClasses({ size: "lg", className: "mt-1 w-full min-h-[44px]" })}
                    >
                        {saving ? "Saving…" : "Save password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
