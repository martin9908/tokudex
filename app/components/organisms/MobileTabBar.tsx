"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, SquaresFour, Trophy } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const TABS: {
    href: string;
    label: string;
    Icon: PhosphorIcon;
    match: (p: string) => boolean;
}[] = [
    {
        href: "/",
        label: "Home",
        Icon: House,
        match: (p) => p === "/",
    },
    {
        href: "/series",
        label: "Library",
        Icon: SquaresFour,
        match: (p) => p.startsWith("/series"),
    },
    {
        href: "/rankings",
        label: "Rankings",
        Icon: Trophy,
        match: (p) => p === "/rankings",
    },
    {
        href: "/achievements",
        label: "Awards",
        Icon: Trophy,
        match: (p) => p.startsWith("/achievements"),
    },
];

export default function MobileTabBar() {
    const pathname = usePathname();

    return (
        <nav className="ios-safe-bottom fixed bottom-0 inset-x-0 z-20 border-t border-[var(--line)] bg-[var(--surface)] md:hidden">
            <ul className="mx-auto max-w-3xl grid grid-cols-4">
                {TABS.map((tab) => {
                    const active = tab.match(pathname);
                    return (
                        <li key={tab.href}>
                            <Link
                                href={tab.href}
                                aria-current={active ? "page" : undefined}
                                className={`tdx-focus-ring relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-[10.5px] font-medium transition-colors ${
                                    active
                                        ? "text-[var(--accent-primary)]"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                }`}
                            >
                                <tab.Icon size={17} weight={active ? "fill" : "regular"} />
                                {tab.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
