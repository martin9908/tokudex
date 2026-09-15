"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const PRIMARY_NAV: { href: string; label: string; match: (p: string) => boolean }[] = [
    { href: "/", label: "Home", match: (p) => p === "/" },
    { href: "/series", label: "Library", match: (p) => p.startsWith("/series") },
    { href: "/rankings", label: "Rankings", match: (p) => p.startsWith("/rankings") },
    { href: "/community", label: "Community", match: (p) => p.startsWith("/community") },
    { href: "/achievements", label: "Awards", match: (p) => p.startsWith("/achievements") },
];

/** Desktop primary navigation; the current section reads in the accent. */
export default function NavLinks() {
    const pathname = usePathname();
    return (
        <div className="hidden md:flex items-center gap-5 text-[13.5px] text-[var(--text-secondary)] ml-3.5">
            {PRIMARY_NAV.map((item) => {
                const active = item.match(pathname);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`tdx-focus-ring rounded transition-colors ${
                            active
                                ? "text-[var(--accent-primary)]"
                                : "hover:text-[var(--text-primary)]"
                        }`}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
}
