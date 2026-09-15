import Link from "next/link";
import { LockSimple } from "@phosphor-icons/react/ssr";
import { getGuestSeries } from "@/lib/guest";
import { LinkButton, PosterImage } from "../atoms";

function LockedTeaser() {
    const badges = [
        "First Steps",
        "Centurion",
        "Destroyer of Worlds",
        "Forever Red",
    ];
    return (
        <section className="relative overflow-hidden tdx-panel p-4 md:p-5">
            <div className="pointer-events-none select-none opacity-40 blur-[1px]">
                <h2 className="text-xl">Achievements &amp; Trophies</h2>
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    {badges.map((b) => (
                        <li key={b} className="tdx-card p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <LockSimple
                                    size={14}
                                    className="text-[var(--text-muted)]"
                                />
                                <p className="text-sm font-medium text-[var(--text-secondary)]">
                                    {b}
                                </p>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">
                                Locked
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--background)]/50">
                <p className="text-sm font-medium">
                    Ranks, badges &amp; franchise trophies
                </p>
                <LinkButton href="/login" className="px-4">
                    Sign up to track &amp; earn
                </LinkButton>
            </div>
        </section>
    );
}

export default async function GuestHome() {
    const series = await getGuestSeries();

    return (
        <div className="max-w-[1100px] mx-auto px-3 md:px-4 py-6 pb-24 md:pb-10 space-y-4">
            <section className="tdx-panel p-5 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent-primary)] mb-1">
                    Browsing as a guest
                </p>
                <h1 className="text-2xl md:text-3xl">
                    Never forget where you left off.
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">
                    TokuDex tracks your tokusatsu, anime, and movies so you
                    remember where you left off. Preview the latest series below
                    — sign up to track every series, log episodes, and earn
                    achievements.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <LinkButton href="/login" className="px-5">
                        Create free account
                    </LinkButton>
                    <LinkButton
                        href="/login"
                        variant="secondary"
                        className="px-5"
                    >
                        Sign in
                    </LinkButton>
                </div>
            </section>

            <section className="tdx-panel p-4 md:p-5">
                <h2 className="text-lg mb-3">Discover titles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {series.map((s) => (
                        <Link
                            key={s.id}
                            href={`/series/${s.id}`}
                            className="tdx-focus-ring tdx-card flex flex-col gap-3 p-3 hover:border-[var(--accent-primary)] transition-colors"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-md">
                                <PosterImage
                                    src={s.cover_image_url}
                                    alt={s.title}
                                    sizes="(max-width: 640px) 90vw, 320px"
                                    iconClassName="h-16 w-16 opacity-80"
                                />
                            </div>
                            <div>
                                <p className="text-[11px] tracking-[0.1em] text-[var(--accent-primary)] uppercase mb-1">
                                    {s.franchise || "Series"}
                                </p>
                                <p className="text-sm font-medium leading-tight">
                                    {s.title}
                                </p>
                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
                                    {s.format === "movie"
                                        ? "Movie"
                                        : `${s.total_episodes || "?"} episodes`}
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
