/**
 * "Support TokuDex" link (Ko-fi). Renders nothing unless NEXT_PUBLIC_KOFI_URL
 * is set, so there's never a broken/placeholder link in production.
 *
 * Set NEXT_PUBLIC_KOFI_URL to your Ko-fi page (e.g. https://ko-fi.com/yourname)
 * in .env.local and in the Vercel project env.
 */
export default function SupportLink({
    className = "",
    label = "Support TokuDex",
}: {
    className?: string;
    label?: string;
}) {
    const url = process.env.NEXT_PUBLIC_KOFI_URL;
    if (!url) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            {label}
        </a>
    );
}
