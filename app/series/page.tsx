import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProgressBySeries } from "@/lib/supabase/queries";
import { toWatchItems } from "@/lib/progress";
import { getGuestSeries } from "@/lib/guest";
import { PosterImage, HairlineRule, buttonClasses } from "../components/atoms";
import DexList, { DEX_FILTERS, type DexFilterKey } from "./DexList";

export const metadata: Metadata = {
    title: "Your dex",
    description: "Every title you track on TokuDex, in one list.",
    alternates: { canonical: "/series" },
};

export default async function DexPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; filter?: string }>;
}) {
    const params = await searchParams;
    // Catalog search moved to the community dex; old links still work.
    if (params.q)
        redirect(`/community/catalog?q=${encodeURIComponent(params.q)}`);
    const filter: DexFilterKey = Object.hasOwn(DEX_FILTERS, params.filter ?? "")
        ? (params.filter as DexFilterKey)
        : "all";

    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();

    if (!user) {
        const picks = await getGuestSeries();
        return (
            <div className="w-full pb-24 md:pb-10">
                <div className="px-[18px] md:px-[30px] pt-[26px] pb-5">
                    <h1 className="text-[26px] font-medium tracking-[-0.025em]">
                        Your dex
                    </h1>
                    <p className="text-[12.5px] text-[var(--text-secondary)] mt-2 max-w-[460px] leading-[1.55]">
                        Tracking needs an account. Browse the shared catalog as a
                        guest, then sign in to keep a dex of your own.
                    </p>
                    <div className="flex gap-2.5 mt-4 flex-wrap">
                        <Link href="/login" className={buttonClasses()}>
                            Sign in
                        </Link>
                        <Link
                            href="/community/catalog"
                            className={buttonClasses({ variant: "secondary" })}
                        >
                            Browse the catalog
                        </Link>
                    </div>
                </div>
                <HairlineRule />
                <p className="px-[18px] md:px-[30px] pt-5 text-[12.5px] text-[var(--text-secondary)]">
                    Start here — the latest run in each franchise
                </p>
                <div className="flex flex-col mt-2">
                    {picks.map((s) => (
                        <Link
                            key={s.id}
                            href={`/series/${s.id}`}
                            className="tdx-row tdx-focus-ring rounded-none grid grid-cols-[42px_1fr_auto] gap-[18px] items-center px-[18px] md:px-[30px] py-3"
                        >
                            <div className="relative w-[42px] aspect-[3/4] rounded overflow-hidden">
                                <PosterImage
                                    src={s.cover_image_url}
                                    alt=""
                                    sizes="42px"
                                    pendingLabel=""
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13.5px] truncate">{s.title}</p>
                                <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
                                    {[s.franchise, s.original_run]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            </div>
                            <span className="text-[12px] text-[var(--text-secondary)]">
                                {s.total_episodes ? `${s.total_episodes} eps` : ""}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    const [rows, { count }, { data: ratingRows }, { data: added }] =
        await Promise.all([
            getUserProgressBySeries(user.id),
            client
                .from("series")
                .select("id", { count: "exact", head: true })
                .eq("hidden", false),
            client
                .from("title_ratings")
                .select("series_id, score")
                .eq("user_id", user.id),
            client
                .from("catalog_submissions")
                .select("series_id")
                .eq("author_id", user.id)
                .eq("status", "published")
                .is("base_revision", null),
        ]);
    const items = toWatchItems(rows)
        .filter((i) => !i.series.hidden)
        .sort(
            (a, b) =>
                new Date(b.progress.last_watched_at).getTime() -
                new Date(a.progress.last_watched_at).getTime(),
        );

    return (
        <DexList
            items={items}
            filter={filter}
            catalogTotal={count ?? 0}
            ratings={Object.fromEntries(
                (ratingRows ?? []).map((r) => [r.series_id, r.score]),
            )}
            addedByYou={
                new Set(
                    (added ?? [])
                        .map((a) => a.series_id)
                        .filter((id): id is string => Boolean(id)),
                )
            }
        />
    );
}
