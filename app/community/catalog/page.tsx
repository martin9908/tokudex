import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";
import { getCatalogPage, getCatalogCredits } from "@/lib/catalogQueries";
import { DEX_FILTERS, type DexFilter } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { PosterImage, HairlineRule, buttonClasses } from "@/app/components/atoms";
import {
    CatalogToolbar,
    Pagination,
    NoResults,
} from "@/app/components/organisms/CatalogChrome";

export const metadata: Metadata = {
    title: "Shared catalog",
    description:
        "Every tokusatsu, anime and movie title on TokuDex — added by fans, published by admins.",
    alternates: { canonical: "/community/catalog" },
};

function family(item: { franchise: string | null; format: string; category: string }) {
    const f = item.franchise ?? "";
    if (/sentai/i.test(f)) return "Sentai";
    if (/rider/i.test(f)) return "Rider";
    if (/ultra/i.test(f)) return "Ultra";
    if (item.format === "movie") return "Movie";
    if (f) return f;
    return item.category.charAt(0).toUpperCase() + item.category.slice(1);
}

export default async function SharedCatalog({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
    const params = await searchParams;
    const catalog = await getCatalogPage(params, false, "dex");
    const client = await createClient();
    const [{ count }, credits] = await Promise.all([
        client
            .from("series")
            .select("id", { count: "exact", head: true })
            .eq("hidden", false),
        getCatalogCredits(catalog.items.map((s) => s.id)),
    ]);
    const path = "/community/catalog";
    const filter = catalog.filter as DexFilter;

    return (
        <div className="w-full pb-24 md:pb-10">
            <div className="flex items-center gap-3 px-[18px] md:px-[30px] py-[13px] border-b border-[var(--line)] text-[12.5px]">
                <Link
                    href="/community"
                    className="tdx-focus-ring rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    Community
                </Link>
                <Link
                    href="/rankings"
                    className="tdx-focus-ring rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    Rankings
                </Link>
                <Link
                    href="/community/new"
                    className={buttonClasses({ size: "sm", className: "ml-auto" })}
                >
                    Add a title
                </Link>
            </div>

            <div className="px-[18px] md:px-[30px] pt-6 pb-[10px]">
                <h1 className="text-[21px] font-medium tracking-[-0.02em]">
                    {(count ?? catalog.total).toLocaleString()} titles, all added by fans
                </h1>
                <p className="mt-2 text-[12.5px] text-[var(--text-secondary)] max-w-[560px] leading-[1.55]">
                    Anyone can add a title or correct one. Admins publish. Entries
                    that are still thin are marked so they&apos;re easy to find.
                </p>
                <div className="mt-[18px]">
                    <CatalogToolbar
                        path={path}
                        filters={DEX_FILTERS}
                        filter={filter}
                        query={catalog.query}
                        total={catalog.total}
                        page={catalog.page}
                        countLabel={catalog.query ? "matches" : "titles"}
                        trailing={
                            <span className="hidden sm:inline text-[12.5px] text-[var(--text-secondary)]">
                                Newest first
                            </span>
                        }
                    />
                </div>
            </div>
            <HairlineRule />

            {catalog.items.length === 0 ? (
                <div className="px-[18px] md:px-[30px] py-6">
                    <NoResults query={catalog.query} ranked={false} />
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-[22px_16px] md:gap-[22px_20px] px-[18px] md:px-[30px] pt-[26px] pb-8">
                    {catalog.items.map((s) => {
                        const thin =
                            !s.cover_image_url ||
                            (s.format === "series" &&
                                s.total_episodes !== null &&
                                (s.episode_count ?? 0) < s.total_episodes);
                        const handle = credits[s.id];
                        return (
                            <Link
                                key={s.id}
                                href={`/series/${s.id}`}
                                className="tdx-focus-ring rounded-md block"
                            >
                                {s.cover_image_url ? (
                                    <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden">
                                        <PosterImage
                                            src={s.cover_image_url}
                                            alt=""
                                            sizes="(max-width:640px) 45vw, 200px"
                                            pendingLabel=""
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full aspect-[3/4] rounded-md border border-dashed border-[var(--line)] grid place-items-center text-[11.5px] text-center leading-[1.4] text-[var(--text-secondary)]">
                                        no poster
                                        <br />
                                        yet
                                    </div>
                                )}
                                <p className="text-[13.5px] mt-[9px] leading-[1.3]">
                                    {s.title}
                                </p>
                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
                                    {[
                                        family(s),
                                        s.release_year,
                                        s.format === "movie"
                                            ? s.runtime_minutes
                                                ? `${s.runtime_minutes} min`
                                                : null
                                            : s.total_episodes
                                              ? `${s.total_episodes} eps`
                                              : null,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                                <p
                                    className={`text-[11.5px] mt-[3px] ${
                                        thin
                                            ? "text-[var(--accent-primary)]"
                                            : "text-[var(--text-muted)]"
                                    }`}
                                >
                                    {thin
                                        ? "needs work"
                                        : handle
                                          ? `added by @${handle}`
                                          : "from the catalog"}
                                </p>
                            </Link>
                        );
                    })}
                    <Link
                        href="/community/new"
                        className="tdx-focus-ring rounded-md block"
                    >
                        <div className="w-full aspect-[3/4] rounded-md border border-dashed border-[var(--line)] grid place-items-center text-[12.5px] text-center leading-[1.4] text-[var(--accent-primary)]">
                            <span>
                                <Plus size={20} className="block mx-auto mb-1.5" aria-hidden />
                                Add a title
                            </span>
                        </div>
                        <p className="text-[11.5px] text-[var(--text-secondary)] mt-[9px] leading-[1.4]">
                            Missing something? Add it and an admin will publish.
                        </p>
                    </Link>
                </div>
            )}
            <div className="px-[18px] md:px-[30px] pb-6">
                <Pagination
                    path={path}
                    filter={filter}
                    query={catalog.query}
                    page={catalog.page}
                    total={catalog.total}
                />
            </div>
        </div>
    );
}
