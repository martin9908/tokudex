import { Coffee } from "@phosphor-icons/react/ssr";
import { buttonClasses } from "../atoms";

/**
 * "Support TokuDex" panel (Ko-fi). Renders nothing unless
 * NEXT_PUBLIC_KOFI_URL is set.
 */
export default function SupportBanner() {
    const url = process.env.NEXT_PUBLIC_KOFI_URL;
    if (!url) return null;

    return (
        <div className="tdx-panel p-4 flex items-center gap-3.5 flex-wrap">
            <Coffee
                size={22}
                className="text-[var(--accent-primary)] flex-none"
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">Enjoying TokuDex?</p>
                <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">
                    Support development with a coffee on Ko-fi — it keeps the
                    lights on.
                </p>
            </div>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ size: "sm" })}
            >
                Support →
            </a>
        </div>
    );
}
