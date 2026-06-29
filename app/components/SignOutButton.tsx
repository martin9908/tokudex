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
            className={`text-sm text-cyan-100/75 hover:text-cyan-300 transition-colors ${className}`}
        >
            Sign out
        </button>
    );
}
