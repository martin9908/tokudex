"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type SignOutButtonProps = {
    className?: string;
};

export default function SignOutButton({ className = "" }: SignOutButtonProps) {
    const router = useRouter();

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <button
            onClick={handleSignOut}
            type="button"
            className={
                className ||
                "text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            }
        >
            Sign out
        </button>
    );
}
