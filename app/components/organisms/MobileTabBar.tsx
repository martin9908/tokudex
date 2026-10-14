"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    TelevisionSimple,
    SquaresFour,
    Trophy,
    UsersThree,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { PRIMARY_NAV } from "../molecules/NavLinks";

const ICONS: Record<string, PhosphorIcon> = {
    "/": TelevisionSimple,
    "/series": SquaresFour,
    "/achievements": Trophy,
    "/community": UsersThree,
};

/** Four tabs on phones — Watching, Dex, Awards, Community. Account lives behind the avatar. */
export default function MobileTabBar() {
    const pathname = usePathname();

    return (
        <nav className="ios-safe-bottom fixed bottom-0 inset-x-0 z-20 border-t border-[var(--line)] bg-[var(--background)] md:hidden">
            <ul className="mx-auto max-w-3xl grid grid-cols-4 px-1">
                {PRIMARY_NAV.map((tab) => {
                    const active = tab.match(pathname);
                    const Icon = ICONS[tab.href];
                    return (
                        <li key={tab.href}>
                            <Link
                                href={tab.href}
                                aria-current={active ? "page" : undefined}
                                className={`tdx-focus-ring relative flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[10.5px] transition-colors ${
                                    active
                                        ? "text-[var(--text-primary)]"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                }`}
                            >
                                <Icon
                                    size={20}
                                    weight={active ? "fill" : "regular"}
                                    className={active ? "text-[var(--accent-primary)]" : ""}
                                />
                                {tab.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
