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

    const inputClass = "min-h-[44px] tdx-field px-3";

    return (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
            <div className="w-full max-w-sm tdx-panel p-6">
                <h1 className="text-2xl font-semibold tracking-tight mb-1">Set a new password</h1>
                <p className="text-sm text-cyan-200/70 mb-6">
                    Choose a new password for your TokuDex account.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                    <button
                        type="submit"
                        disabled={saving}
                        className={buttonClasses({ variant: "primary", className: "mt-1 px-5" })}
                    >
                        {saving ? "Saving…" : "Update password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
