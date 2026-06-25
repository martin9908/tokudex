"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileTabBar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur md:hidden">
            <ul className="mx-auto max-w-3xl grid grid-cols-2">
                <li>
                    <Link
                        href="/"
                        className={`flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${pathname === "/"
                                ? "text-zinc-900 dark:text-zinc-50"
                                : "text-zinc-500 dark:text-zinc-400"
                            }`}
                    >
                        <span className="text-base" aria-hidden>
                            🏠
                        </span>
                        Home
                    </Link>
                </li>
                <li>
                    <Link
                        href="/series"
                        className={`flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${pathname.startsWith("/series")
                                ? "text-zinc-900 dark:text-zinc-50"
                                : "text-zinc-500 dark:text-zinc-400"
                            }`}
                    >
                        <span className="text-base" aria-hidden>
                            📚
                        </span>
                        Series
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
