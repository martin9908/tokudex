import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, SealCheck, Medal } from "@phosphor-icons/react/ssr";
import { getShareCard } from "@/lib/share";
import { buttonClasses } from "../../components/atoms";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

type SharePageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
    const { slug } = await params;
    const card = await getShareCard(slug);
    if (!card) return { title: "Share", robots: { index: false, follow: false } };

    const stat = card.stat_value ? ` · ${card.stat_value} ${card.stat_label}` : "";
    const description = `${card.subtitle ?? ""}${stat} — on ${SITE_NAME}`;
    return {
        title: card.title,
        description,
        alternates: { canonical: `/share/${slug}` },
        openGraph: {
            title: `${card.title} · ${SITE_NAME}`,
            description,
            url: absoluteUrl(`/share/${slug}`),
        },
        twitter: { card: "summary_large_image", title: card.title, description },
    };
}

/** Three card kinds, one layout: stats (trophy), series badge (seal), achievement (medal). */
function KindIcon({ kind }: { kind: string }) {
    const className = "mx-auto text-[var(--accent-primary)]";
    if (kind === "series") return <SealCheck size={38} weight="fill" className={className} aria-hidden />;
    if (kind === "stats" || kind === "rank") return <Trophy size={38} weight="fill" className={className} aria-hidden />;
    return <Medal size={38} weight="fill" className={className} aria-hidden />;
}

export default async function SharePage({ params }: SharePageProps) {
    const { slug } = await params;
    const card = await getShareCard(slug);
    if (!card) notFound();

    const headline =
        card.stat_value && card.stat_label
            ? `${card.stat_value} ${card.stat_label}`
            : card.title;
    const eyebrow =
        card.stat_value && card.stat_label
            ? `${card.subtitle ? card.subtitle.replace(/ on TokuDex$/, "") : "Rank"} · ${card.title}`
            : card.subtitle;

    return (
        <div className="max-w-[436px] mx-auto px-4 py-12 pb-24 w-full">
            <div className="tdx-panel px-7 py-8 text-center">
                <KindIcon kind={card.kind} />
                {eyebrow && (
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-primary)] mt-3.5">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-[25px] font-medium tracking-[-0.02em] mt-2">
                    {headline}
                </h1>
                <p className="text-[13px] text-[var(--text-secondary)] mt-2.5 leading-[1.5]">
                    {card.display_name ?? "A TokuDex fan"} on {SITE_NAME} — the
                    tokusatsu episode tracker.
                </p>
                <Link
                    href="/login?mode=signup"
                    className={buttonClasses({ size: "lg", className: "mt-5 px-5 min-h-[44px]" })}
                >
                    Start tracking free
                </Link>
                <p className="mt-4 text-[11px] text-[var(--text-muted)]">
                    <Link href="/" className="hover:text-[var(--text-primary)]">
                        tokudex.app
                    </Link>{" "}
                    · track tokusatsu, earn achievements
                </p>
            </div>
        </div>
    );
}
