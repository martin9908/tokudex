import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { createClient } from "../../../lib/supabase/server";
import SignOutButton from "../molecules/SignOutButton";

function initialsFor(name: string | undefined, email: string | undefined) {
    const trimmed = name?.trim();
    if (trimmed) {
        const parts = trimmed.split(/\s+/);
        return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    return email ? email[0].toUpperCase() : "?";
}

export default async function Navbar() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <nav className="ios-safe-top sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]">
            <div className="max-w-6xl mx-auto px-6 py-[13px] flex items-center gap-5">
                <Link href="/" className="flex flex-col" aria-label="TokuDex">
                    <span className="text-lg font-semibold tracking-[-0.035em] leading-none">
                        Toku
                        <span className="text-[var(--accent-primary)]">
                            Dex
                        </span>
                    </span>
                    <span
                        aria-hidden
                        className="mt-1 h-[2.5px] w-full rounded-full bg-[var(--sunk)] overflow-hidden"
                    >
                        <span className="block h-full w-[46%] bg-[var(--accent-primary)]" />
                    </span>
                </Link>
                <span className="hidden sm:inline border-l border-[var(--line)] pl-3.5 text-[9.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Episode tracker
                </span>

                <div className="hidden md:flex items-center gap-5 text-[13.5px] text-[var(--text-secondary)] ml-3.5">
                    <Link
                        href="/"
                        className="hover:text-[var(--accent-primary)] transition-colors"
                    >
                        Home
                    </Link>
                    <Link
                        href="/series"
                        className="hover:text-[var(--accent-primary)] transition-colors"
                    >
                        Library
                    </Link>
                    <Link
                        href="/rankings"
                        className="hover:text-[var(--accent-primary)] transition-colors"
                    >
                        Rankings
                    </Link>
                    {user && (
                        <Link
                            href="/community"
                            className="hover:text-[var(--accent-primary)] transition-colors"
                        >
                            Contribute
                        </Link>
                    )}
                    {user && (
                        <Link
                            href="/achievements"
                            className="hover:text-[var(--accent-primary)] transition-colors"
                        >
                            Achievements
                        </Link>
                    )}
                    {user && (
                        <Link
                            href="/account"
                            className="hover:text-[var(--accent-primary)] transition-colors"
                        >
                            Account
                        </Link>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <form
                        action="/series"
                        className="hidden lg:flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 text-[12.5px] text-[var(--text-muted)] w-[200px] focus-within:border-[var(--accent-primary)] transition-colors"
                    >
                        <MagnifyingGlass size={14} aria-hidden />
                        <input
                            type="search"
                            name="q"
                            placeholder="Search series"
                            aria-label="Search series"
                            className="flex-1 min-w-0 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                        />
                        <span className="text-[10px]">⌘K</span>
                    </form>
                    {user ? (
                        <>
                            <Link
                                href="/account"
                                aria-label="Account"
                                className="tdx-focus-ring h-7 w-7 rounded-full bg-[var(--accent-tint)] text-[var(--accent-on)] flex items-center justify-center text-[11px] font-semibold hover:opacity-85 transition-opacity"
                            >
                                {initialsFor(
                                    user.user_metadata?.full_name as
                                        | string
                                        | undefined,
                                    user.email,
                                )}
                            </Link>
                            <SignOutButton className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] text-sm" />
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] px-3 py-1.5 font-medium hover:bg-[var(--accent-tint)] transition-colors"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
