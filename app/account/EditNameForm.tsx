"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "../components/atoms";

export default function EditNameForm({ initialName }: { initialName: string }) {
    const router = useRouter();
    const id = useId();
    const [name, setName] = useState(initialName);
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setDone(false);

        const trimmed = name.trim();
        if (!trimmed) {
            setError("Name can't be empty.");
            return;
        }

        setSaving(true);
        const { error: updateError } = await createClient().auth.updateUser({
            data: { full_name: trimmed },
        });
        setSaving(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }
        setDone(true);
        // Refresh so the navbar/home greeting pick up the new name.
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor={id} className="tdx-label">
                Display name{" "}
                <span className="tdx-label-hint">shown on shared cards</span>
            </label>
            <div className="flex flex-wrap gap-2">
                <input
                    id={id}
                    type="text"
                    value={name}
                    maxLength={60}
                    onChange={(e) => {
                        setName(e.target.value);
                        setDone(false);
                    }}
                    placeholder="Your name"
                    className="tdx-field flex-1 min-w-[180px]"
                />
                <button
                    type="submit"
                    disabled={saving || name.trim() === initialName.trim()}
                    className={buttonClasses()}
                >
                    {saving ? "Saving…" : "Save name"}
                </button>
            </div>
            {error && (
                <p role="alert" className="mt-2 text-xs text-[var(--warning)]">
                    {error}
                </p>
            )}
            {done && (
                <p role="status" className="mt-2 text-xs text-[var(--success)]">
                    Name updated.
                </p>
            )}
        </form>
    );
}
