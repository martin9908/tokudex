/**
 * Prominent "Support TokuDex" banner (Ko-fi). Renders nothing unless
 * NEXT_PUBLIC_KOFI_URL is set.
 */
export default function SupportBanner() {
    const url = process.env.NEXT_PUBLIC_KOFI_URL;
    if (!url) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="tdx-focus-ring group flex items-center gap-4 rounded-2xl border border-amber-400/40 bg-[linear-gradient(110deg,rgba(255,200,87,0.14),rgba(0,200,255,0.08))] p-4 md:p-5 transition-colors hover:border-amber-300/60"
        >
            <span className="text-3xl" aria-hidden>
                ☕
            </span>
            <div className="min-w-0">
                <p className="font-semibold text-cyan-50">Enjoying TokuDex?</p>
                <p className="text-sm text-cyan-100/75">
                    Support development with a coffee on Ko-fi — it keeps the lights on.
                </p>
            </div>
            <span className="ml-auto shrink-0 rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-[#231600] transition-colors group-hover:bg-amber-300">
                Support →
            </span>
        </a>
    );
}
