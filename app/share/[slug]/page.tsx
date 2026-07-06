import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShareCard, shareEmoji } from "@/lib/share";
import { LinkButton } from "../../components/atoms";
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

export default async function SharePage({ params }: SharePageProps) {
    const { slug } = await params;
    const card = await getShareCard(slug);
    if (!card) notFound();

    return (
        <div className="max-w-lg mx-auto px-4 py-16 w-full">
            <div className="tdx-panel p-8 text-center">
                <p className="text-5xl mb-4" aria-hidden>
                    {shareEmoji(card.kind)}
                </p>
                {card.subtitle && (
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">
                        {card.subtitle}
                    </p>
                )}
                <h1 className="text-3xl font-bold tracking-tight mb-3">{card.title}</h1>
                {card.stat_value && (
                    <p className="text-cyan-100/80 mb-1">
                        <span className="text-2xl font-bold text-cyan-300">{card.stat_value}</span>{" "}
                        {card.stat_label}
                    </p>
                )}
                <p className="text-sm text-cyan-200/70 mt-4 mb-6">
                    {card.display_name ?? "A TokuDex fan"} on {SITE_NAME} — the tokusatsu episode tracker.
                </p>
                <LinkButton href="/login" className="px-5">
                    Start tracking free
                </LinkButton>
            </div>
            <p className="text-center text-xs text-cyan-200/55 mt-4">
                <Link href="/" className="hover:text-cyan-200">
                    {SITE_NAME}
                </Link>{" "}
                · track tokusatsu, earn achievements
            </p>
        </div>
    );
}
