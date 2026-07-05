import Image from "next/image";
import type { StaticImageData } from "next/image";
import tokudexIcon from "../../../assets/tokudex_icon.png";

interface PosterImageProps {
    /** Cover art URL. When absent, the TokuDex icon is shown as a fallback. */
    src?: string | null;
    alt: string;
    /** Responsive `sizes` hint for the fill image. */
    sizes?: string;
    /** Extra classes for the cover image (object-position, scale, etc.). */
    imageClassName?: string;
    /** Sizing/opacity classes for the fallback icon. */
    iconClassName?: string;
    /** Optional fallback icon (defaults to the TokuDex mark). */
    fallbackIcon?: StaticImageData;
    /** Render a subtle bottom gradient over the cover. */
    overlay?: boolean;
}

/**
 * Renders cover art inside a sized `relative overflow-hidden` frame provided by
 * the parent, falling back to the TokuDex icon when no cover exists. This is the
 * single source of truth for the "poster or placeholder" pattern used across
 * cards, heroes, and lists.
 */
export default function PosterImage({
    src,
    alt,
    sizes = "(max-width: 768px) 45vw, 220px",
    imageClassName = "object-cover object-center",
    iconClassName = "h-16 w-16 opacity-80",
    fallbackIcon = tokudexIcon,
    overlay = false,
}: PosterImageProps) {
    return (
        <>
            {src ? (
                <Image src={src} alt={alt} fill sizes={sizes} className={imageClassName} />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <Image src={fallbackIcon} alt={alt} className={iconClassName} />
                </div>
            )}
            {overlay && (
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,19,0.08)_0%,rgba(2,9,19,0.22)_60%,rgba(2,9,19,0.42)_100%)]" />
            )}
        </>
    );
}
