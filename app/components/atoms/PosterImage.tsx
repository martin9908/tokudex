import Image from "next/image";

interface PosterImageProps {
    /** Cover art URL. When absent, a dashed "Poster pending" tile is shown. */
    src?: string | null;
    alt: string;
    /** Responsive `sizes` hint for the fill image. */
    sizes?: string;
    /** Extra classes for the cover image (object-position, scale, etc.). */
    imageClassName?: string;
    /** Text inside the placeholder tile. */
    pendingLabel?: React.ReactNode;
    /** Extra classes for the placeholder tile (font size, padding). */
    pendingClassName?: string;
}

/**
 * Renders cover art inside a sized `relative overflow-hidden` frame provided by
 * the parent. Titles without approved art get the dashed placeholder — the
 * catalog never shows a substitute image, so "no poster yet" is legible at a
 * glance. This is the single source of truth for the poster-or-placeholder
 * pattern used across cards, heroes, and lists.
 */
export default function PosterImage({
    src,
    alt,
    sizes = "(max-width: 768px) 45vw, 220px",
    imageClassName = "object-cover object-center",
    pendingLabel = "Poster pending",
    pendingClassName = "",
}: PosterImageProps) {
    if (src) {
        return (
            <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                className={imageClassName}
            />
        );
    }
    return (
        <div
            role="img"
            aria-label={`${alt} — poster pending`}
            className={`tdx-poster-pending absolute inset-0 rounded-none border-0 ${pendingClassName}`}
        >
            <span className="rounded-md border border-dashed border-[var(--line)] px-2 py-1.5 leading-tight">
                {pendingLabel}
            </span>
        </div>
    );
}
