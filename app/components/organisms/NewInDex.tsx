import Link from "next/link";
import { franchiseFamily } from "@/lib/catalog";
import { PosterImage } from "../atoms";

export type NewTitle = {
    id: string;
    title: string;
    franchise: string | null;
    category: string;
    format: string;
    release_year: number | null;
    cover_image_url: string | null;
};

/** The latest published titles, credited to whoever added them. */
export default function NewInDex({
    titles,
    addedThisMonth,
    credits,
}: {
    titles: NewTitle[];
    addedThisMonth: number;
    credits: Record<string, string>;
}) {
    if (titles.length === 0) return null;
    return (
        <section className="px-[18px] py-[22px] md:p-[30px]">
            <div className="flex items-baseline gap-2.5">
                <h2 className="text-[15px] font-medium">New in the dex</h2>
                <p className="text-[11.5px] text-[var(--text-secondary)]">
                    {addedThisMonth > 0
                        ? `${addedThisMonth} added this month`
                        : "latest additions"}
                </p>
                <Link
                    href="/community/catalog"
                    className="tdx-focus-ring rounded-sm ml-auto text-[12px] whitespace-nowrap"
                >
                    Open the dex{" "}
                    <span className="text-[var(--accent-primary)]">→</span>
                </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[14px] mt-[18px]">
                {titles.map((s) => (
                    <Link
                        key={s.id}
                        href={`/series/${s.id}`}
                        className="tdx-focus-ring group rounded-md block"
                    >
                        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md border border-[var(--line)] group-hover:border-[var(--accent-primary)] transition-colors">
                            <PosterImage
                                src={s.cover_image_url}
                                alt=""
                                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 180px"
                                pendingLabel={
                                    <>
                                        No poster
                                        <br />
                                        yet
                                    </>
                                }
                            />
                        </div>
                        <p className="text-[13px] mt-[9px] leading-[1.3]">
                            {s.title}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                            {[franchiseFamily(s), s.release_year]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-[3px]">
                            {credits[s.id]
                                ? `added by @${credits[s.id]}`
                                : "from the catalog"}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
