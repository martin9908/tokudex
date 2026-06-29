import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase/server";
import SignOutButton from "./SignOutButton";
import tokudexLogo from "../../assets/tokudex_logo.png";
import tokudexIcon from "../../assets/tokudex_icon.png";

export default async function Navbar() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <nav className="sticky top-0 z-30 border-b border-cyan-950/70 bg-[#12202f]/85 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2.5">
                    <Image
                        src={tokudexLogo}
                        alt="TokuDex"
                        priority
                        className="h-8 md:h-9 w-auto"
                    />
                    <span className="hidden sm:inline border-l border-cyan-900/60 pl-2.5 text-[11px] uppercase tracking-[0.2em] text-cyan-200/75">
                        Episode Tracker
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-5 text-sm text-cyan-100/75">
                    <Link href="/" className="hover:text-cyan-300 transition-colors">Home</Link>
                    <Link
                        href="/series"
                        className="hover:text-cyan-300 transition-colors"
                    >
                        Series
                    </Link>
                    <span className="text-cyan-100/45">Watchlist</span>
                    {user && (
                        <Link href="/account" className="hover:text-cyan-300 transition-colors">
                            Account
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link
                                href="/account"
                                aria-label="Account"
                                className="tdx-focus-ring h-9 w-9 rounded-full border border-cyan-700/50 bg-[#081a2b] flex items-center justify-center overflow-hidden hover:border-cyan-400/60 transition-colors"
                            >
                                <Image src={tokudexIcon} alt="" className="w-5 h-5 opacity-85" />
                            </Link>
                            <SignOutButton className="text-cyan-100/75 hover:text-cyan-300 text-sm" />
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm rounded-lg bg-cyan-500/90 text-[#031018] px-3 py-1.5 font-semibold hover:bg-cyan-400 transition-colors"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
