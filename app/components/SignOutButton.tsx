"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

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
            className={`text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors ${className}`}
        >
            Sign out
        </button>
    );
}
