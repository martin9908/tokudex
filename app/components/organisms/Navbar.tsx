import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { createClient } from "../../../lib/supabase/server";
import NavLinks from "../molecules/NavLinks";
import { buttonClasses } from "../atoms";

function initialsFor(name: string | undefined, email: string | undefined) {
    const trimmed = name?.trim();
    if (trimmed) {
        const parts = trimmed.split(/\s+/);
        return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    return email ? email[0].toUpperCase() : "?";
}

/** Wordmark draft A — tight tracking, accent on the second half, no mark. */
export function Wordmark({ size = 18 }: { size?: number }) {
    return (
        <span
            className="font-semibold tracking-[-0.035em] leading-none"
            style={{ fontSize: size }}
            aria-label="TokuDex"
        >
            Toku
            <span className="text-[var(--accent-primary)]">Dex</span>
        </span>
    );
}

export default async function Navbar() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    let logged = 0;
    if (user) {
        const { data } = await supabase
            .from("user_series_progress")
            .select("current_episode")
            .eq("user_id", user.id);
        logged = (data ?? []).reduce(
            (n, r) => n + (r.current_episode ?? 0),
            0,
        );
    }

    return (
        <nav className="ios-safe-top sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--background)]">
            <div className="w-full px-[18px] sm:px-[30px] py-[14px] md:py-[15px] flex items-center gap-4 md:gap-[22px]">
                <Link href="/" className="tdx-focus-ring rounded-sm">
                    <Wordmark />
                </Link>

                <NavLinks />

                <div className="ml-auto flex items-center gap-4 text-[12.5px] text-[var(--text-secondary)]">
                    <Link
                        href="/community/catalog"
                        aria-label="Search the catalog"
                        className="tdx-focus-ring rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <MagnifyingGlass size={18} aria-hidden />
                    </Link>
                    {user ? (
                        <>
                            <span className="hidden sm:inline tabular-nums">
                                {logged.toLocaleString()} logged
                            </span>
                            <Link
                                href="/account"
                                aria-label="Account"
                                className="tdx-focus-ring h-[26px] w-[26px] rounded-full bg-[var(--sunk)] text-[var(--text-secondary)] grid place-items-center text-[10.5px] hover:text-[var(--text-primary)] transition-colors"
                            >
                                {initialsFor(
                                    user.user_metadata?.full_name as
                                        | string
                                        | undefined,
                                    user.email,
                                )}
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="tdx-chip hidden sm:inline-flex">
                                Guest
                            </span>
                            <Link
                                href="/login"
                                className={buttonClasses({ size: "sm" })}
                            >
                                Sign in
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
