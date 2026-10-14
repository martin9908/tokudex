"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const PRIMARY_NAV: {
    href: string;
    label: string;
    match: (p: string) => boolean;
}[] = [
    { href: "/", label: "Watching", match: (p) => p === "/" || p === "/watch" },
    { href: "/series", label: "Dex", match: (p) => p.startsWith("/series") },
    {
        href: "/achievements",
        label: "Awards",
        match: (p) => p.startsWith("/achievements"),
    },
    {
        href: "/community",
        label: "Community",
        match: (p) =>
            p.startsWith("/community") ||
            p.startsWith("/rankings") ||
            p.startsWith("/admin"),
    },
];

/** Desktop primary navigation; the current section carries a 2px accent underline. */
export default function NavLinks() {
    const pathname = usePathname();
    return (
        <div className="hidden md:flex items-center gap-5 text-[13px] text-[var(--text-secondary)] ml-1">
            {PRIMARY_NAV.map((item) => {
                const active = item.match(pathname);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`tdx-focus-ring rounded-sm pb-[5px] -mb-[5px] transition-colors ${
                            active
                                ? "text-[var(--text-primary)] shadow-[inset_0_-2px_0_var(--accent-primary)]"
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
