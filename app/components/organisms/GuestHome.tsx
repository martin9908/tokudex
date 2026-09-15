import Link from "next/link";
import { LockSimple, DeviceMobile } from "@phosphor-icons/react/ssr";
import { getGuestSeries } from "@/lib/guest";
import { PosterImage, buttonClasses } from "../atoms";

/**
 * Home for signed-out visitors: a short pitch, a handful of titles to open,
 * and a plain statement of what needs an account. Guest browsing is read-only.
 */
export default async function GuestHome() {
    const series = await getGuestSeries();

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 flex flex-col gap-5">
            <div className="tdx-callout">
                <DeviceMobile size={16} className="mt-0.5 flex-none" aria-hidden />
                <span>
                    You&apos;re browsing as a guest. Create an account to log
                    episodes, keep your progress, and sync it across devices.
                </span>
            </div>

            <section className="tdx-panel p-5 md:p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-primary)]">
                    Tokusatsu episode tracker
                </p>
                <h1 className="text-[26px] md:text-[30px] leading-[1.15] mt-2">
                    Never forget where you left off.
                </h1>
                <p className="text-[13.5px] leading-[1.55] text-[var(--text-secondary)] mt-2 max-w-[560px]">
                    Remember where you stopped and what happened last — TokuDex
                    tracks your tokusatsu, anime, and movies. It doesn&apos;t
                    stream episodes; it keeps your place.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link href="/login?mode=signup" className={buttonClasses()}>
                        Create free account
                    </Link>
                    <Link
                        href="/login"
                        className={buttonClasses({ variant: "secondary" })}
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/series"
                        className={buttonClasses({ variant: "ghost" })}
                    >
                        Browse the catalog →
                    </Link>
                </div>
            </section>

            <section>
                <div className="flex items-baseline gap-2.5 mb-2.5">
                    <span className="tdx-eyebrow text-[10.5px]">
                        Start here
                    </span>
                    <span className="text-[11.5px] text-[var(--text-muted)]">
                        the latest run in each franchise
                    </span>
                    <Link
                        href="/series"
                        className="ml-auto text-xs text-[var(--accent-primary)]"
                    >
                        Browse library →
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {series.map((s) => (
                        <Link
                            key={s.id}
                            href={`/series/${s.id}`}
                            className="tdx-focus-ring group flex flex-col gap-2 rounded-md"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-[var(--line)] group-hover:border-[var(--accent-primary)] transition-colors">
                                <PosterImage
                                    src={s.cover_image_url}
                                    alt={s.title}
                                    sizes="(max-width: 640px) 45vw, 220px"
                                />
                            </div>
                            <p className="text-[13px] font-medium leading-[1.25]">
                                {s.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                                {s.format === "movie"
                                    ? "Movie"
                                    : `${s.total_episodes ?? "?"} episodes`}
                                {s.franchise ? ` · ${s.franchise}` : ""}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            <div className="tdx-callout tdx-callout-quiet items-center">
                <LockSimple size={15} aria-hidden />
                Ratings, rankings and achievements need an account.
            </div>
        </div>
    );
}
