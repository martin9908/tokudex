import Link from "next/link";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react/ssr";
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

/** Wordmark with the progress underscore — logo draft A from the brand sheet. */
export function Wordmark({ size = 18 }: { size?: number }) {
    return (
        <span className="flex flex-col" aria-label="TokuDex">
            <span
                className="font-semibold tracking-[-0.035em] leading-none"
                style={{ fontSize: size }}
            >
                Toku
                <span className="text-[var(--accent-primary)]">Dex</span>
            </span>
            <span
                aria-hidden
                className="mt-1 h-[2.5px] w-full rounded-[2px] bg-[var(--sunk)] overflow-hidden"
            >
                <span className="block h-full w-[46%] bg-[var(--accent-primary)]" />
            </span>
        </span>
    );
}

export default async function Navbar() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <nav className="ios-safe-top sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-[13px] flex items-center gap-4 sm:gap-5">
                <Link href="/" className="tdx-focus-ring rounded">
                    <Wordmark />
                </Link>
                <span className="hidden lg:inline border-l border-[var(--line)] pl-3.5 text-[9.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Episode tracker
                </span>

                <NavLinks />

                <div className="ml-auto flex items-center gap-3">
                    <form
                        action="/series"
                        className="hidden lg:flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 text-[12.5px] text-[var(--text-muted)] w-[200px] focus-within:border-[var(--accent-primary)] focus-within:text-[var(--text-primary)] transition-colors"
                    >
                        <MagnifyingGlass size={14} aria-hidden />
                        <input
                            type="search"
                            name="q"
                            placeholder="Search catalog"
                            aria-label="Search catalog"
                            className="flex-1 min-w-0 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                        />
                    </form>
                    {user ? (
                        <>
                            <Link
                                href="/community/new"
                                className={buttonClasses({
                                    variant: "secondary",
                                    size: "sm",
                                    className: "hidden sm:inline-flex",
                                })}
                            >
                                <Plus size={13} aria-hidden />
                                Add a title
                            </Link>
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
