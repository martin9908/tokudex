"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function SeriesIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M4 5a1 1 0 0 1 1-1h5v16H5a1 1 0 0 1-1-1V5Zm10-1h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5V4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function TrophyIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M7 4h10v3a5 5 0 0 1-10 0V4Zm0 1H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3M9 13.5h6M12 12v3m-3 5h6M10 17.5h4V20h-4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const TABS = [
    { href: "/", label: "Home", Icon: HomeIcon, match: (p: string) => p === "/" },
    {
        href: "/series",
        label: "Series",
        Icon: SeriesIcon,
        match: (p: string) => p.startsWith("/series"),
    },
    {
        href: "/achievements",
        label: "Awards",
        Icon: TrophyIcon,
        match: (p: string) => p.startsWith("/achievements"),
    },
];

export default function MobileTabBar() {
    const pathname = usePathname();

    return (
        <nav className="ios-safe-bottom fixed bottom-0 inset-x-0 z-20 border-t border-cyan-950/70 bg-[#12202f]/95 backdrop-blur-xl md:hidden">
            <ul className="mx-auto max-w-3xl grid grid-cols-3">
                {TABS.map((tab) => {
                    const active = tab.match(pathname);
                    return (
                        <li key={tab.href}>
                            <Link
                                href={tab.href}
                                aria-current={active ? "page" : undefined}
                                className={`tdx-focus-ring relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${active
                                        ? "text-cyan-300"
                                        : "text-cyan-100/60 hover:text-cyan-100/90"
                                    }`}
                            >
                                {active && (
                                    <span
                                        className="absolute top-0 h-0.5 w-10 rounded-full bg-cyan-400"
                                        aria-hidden
                                    />
                                )}
                                <tab.Icon />
                                {tab.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
