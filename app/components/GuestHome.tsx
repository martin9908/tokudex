import Image from "next/image";
import Link from "next/link";
import { getGuestSeries } from "@/lib/guest";
import tokudexIcon from "../../assets/tokudex_icon.png";

// A locked/grayed gamification teaser — shows guests what they'd unlock.
function LockedTeaser() {
    const badges = ["First Steps", "Centurion", "Destroyer of Worlds", "Forever Red"];
    return (
        <section className="relative overflow-hidden rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 md:p-5">
            <div className="pointer-events-none select-none opacity-40 blur-[1px]">
                <h2 className="text-2xl font-semibold mb-3">Achievements &amp; Trophies</h2>
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {badges.map((b) => (
                        <li key={b} className="rounded-xl border border-cyan-900/45 bg-[#081a2b]/60 p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span aria-hidden>🔒</span>
                                <p className="text-sm font-semibold text-cyan-100/60">{b}</p>
                            </div>
                            <p className="text-xs text-cyan-200/60">Locked</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#060b13]/40">
                <p className="text-sm font-semibold text-cyan-50">Ranks, badges &amp; franchise trophies</p>
                <Link
                    href="/login"
                    className="tdx-focus-ring inline-flex min-h-[40px] items-center rounded-xl bg-cyan-500/90 px-4 text-sm font-semibold text-[#031018] hover:bg-cyan-400 transition-colors"
                >
                    Sign up to track &amp; earn
                </Link>
            </div>
        </section>
    );
}

export default async function GuestHome() {
    const series = await getGuestSeries();

    return (
        <div className="max-w-[1100px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10 space-y-4">
            {/* Guest banner */}
            <section className="rounded-2xl border border-cyan-600/40 bg-cyan-500/[0.07] p-5 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                    Browsing as a guest
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Never forget where you left off.
                </h1>
                <p className="text-cyan-100/80 mt-2 max-w-2xl">
                    TokuDex tracks which tokusatsu episode you&apos;re on and what happened last.
                    Preview the latest series below — sign up to track every series, log episodes,
                    and earn achievements.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                        href="/login"
                        className="tdx-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cyan-500/90 px-5 text-sm font-semibold text-[#031018] hover:bg-cyan-400 transition-colors"
                    >
                        Create free account
                    </Link>
                    <Link
                        href="/login"
                        className="tdx-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cyan-900/60 px-5 text-sm font-medium text-cyan-100 hover:bg-cyan-500/10 transition-colors"
                    >
                        Sign in
                    </Link>
                </div>
            </section>

            {/* Latest series preview */}
            <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 md:p-5">
                <h2 className="text-xl font-semibold mb-3">Latest series</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {series.map((s) => (
                        <Link
                            key={s.id}
                            href={`/series/${s.id}`}
                            className="tdx-focus-ring group flex flex-col gap-3 rounded-xl border border-cyan-900/45 bg-[#081a2b]/70 p-3 hover:border-cyan-700/45 hover:bg-[#07182c]/80 transition-colors"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-cyan-900/50 bg-[#091a2b] flex items-center justify-center">
                                {s.cover_image_url ? (
                                    <Image
                                        src={s.cover_image_url}
                                        alt={s.title}
                                        fill
                                        sizes="(max-width: 640px) 90vw, 320px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <Image src={tokudexIcon} alt={s.title} className="w-16 h-16 opacity-80" />
                                )}
                            </div>
                            <div>
                                <p className="text-[11px] tracking-[0.25em] text-cyan-200/70 uppercase mb-1">
                                    {s.franchise || "Series"}
                                </p>
                                <p className="font-semibold leading-tight text-cyan-50/95">{s.title}</p>
                                <p className="text-xs text-cyan-200/70 mt-1">
                                    {s.total_episodes || "?"} episodes
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <LockedTeaser />
        </div>
    );
}
