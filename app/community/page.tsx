import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfilesByIds, getProfile } from "@/lib/profiles";
import { relativeTime, daysAgoIso } from "@/lib/progress";
import { BigNumber, HairlineRule, buttonClasses } from "../components/atoms";

export const metadata: Metadata = {
    title: "Community",
    description: "What other people logged this week, and titles that need a hand.",
    alternates: { canonical: "/community" },
};

type ActivityRow = {
    id: string;
    user_id: string;
    kind: "logged" | "finished" | "shelved" | "added" | "corrected";
    episode: number | null;
    created_at: string;
    series: {
        id: string;
        title: string;
        total_episodes: number | null;
        format: string;
    } | null;
};

function verb(row: ActivityRow) {
    const title = row.series?.title ?? "a title";
    switch (row.kind) {
        case "finished":
            return `finished ${title}`;
        case "shelved":
            return `shelved ${title} at ${row.episode ?? 0}`;
        case "added":
            return `added ${title}`;
        case "corrected":
            return `corrected ${title}`;
        default:
            return `logged ${title} ${row.episode ?? ""}`.trim();
    }
}

function subline(row: ActivityRow) {
    const when = relativeTime(row.created_at);
    const total = row.series?.total_episodes;
    switch (row.kind) {
        case "finished":
            return `${row.series?.format === "movie" ? "Watched" : total ? `All ${total}` : "Done"} · ${when}`;
        case "shelved":
            return `${row.episode ?? 0} of ${total ?? "?"} · ${when}`;
        case "added":
        case "corrected":
            return `Published by an admin · ${when}`;
        default:
            return `${row.episode ?? 0} of ${total ?? "?"} · ${when}`;
    }
}

function bigNumber(row: ActivityRow) {
    if (row.kind === "finished")
        return row.series?.format === "movie" ? 1 : (row.series?.total_episodes ?? row.episode ?? 1);
    if (row.kind === "added" || row.kind === "corrected") return 1;
    return row.episode ?? 0;
}

export default async function CommunityHome({
    searchParams,
}: {
    searchParams: Promise<{ all?: string }>;
}) {
    const { all } = await searchParams;
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    const since = daysAgoIso(7);
    const limit = all ? 100 : 12;

    const [
        { data: feedRows },
        { count: weekCount },
        { data: thinRows },
        me,
        { data: mineRows },
        { data: myCorrections },
    ] = await Promise.all([
        client
            .from("activity")
            .select(
                "id, user_id, kind, episode, created_at, series(id, title, total_episodes, format)",
            )
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(limit),
        client
            .from("activity")
            .select("id", { count: "exact", head: true })
            .in("kind", ["logged", "finished"])
            .gte("created_at", since),
        client
            .from("series")
            .select("id, title, total_episodes, cover_image_url, format")
            .eq("hidden", false)
            .is("cover_image_url", null)
            .order("release_year", { ascending: false, nullsFirst: false })
            .limit(3),
        user ? getProfile(user.id) : Promise.resolve(null),
        user
            ? client
                  .from("user_series_progress")
                  .select("current_episode, status")
                  .eq("user_id", user.id)
            : Promise.resolve({ data: null }),
        user
            ? client
                  .from("catalog_submissions")
                  .select("status")
                  .eq("author_id", user.id)
                  .eq("status", "published")
                  .not("base_revision", "is", null)
            : Promise.resolve({ data: null }),
    ]);

    const feed = ((feedRows ?? []) as unknown as ActivityRow[]).filter(
        (r) => r.series,
    );
    const profiles = await getProfilesByIds(feed.map((r) => r.user_id));
    const needsHand = await Promise.all(
        ((thinRows ?? []) as {
            id: string;
            title: string;
            total_episodes: number | null;
            cover_image_url: string | null;
            format: string;
        }[]).map(async (s) => {
            const { count } = await client
                .from("episodes")
                .select("id", { count: "exact", head: true })
                .eq("series_id", s.id);
            const missing =
                s.format === "series" && s.total_episodes
                    ? Math.max(0, s.total_episodes - (count ?? 0))
                    : 0;
            return { ...s, missing };
        }),
    );

    const mine = mineRows ?? [];
    const logged = mine.reduce((n, r) => n + (r.current_episode ?? 0), 0);
    const finished = mine.filter((r) => r.status === "completed").length;

    return (
        <div className="w-full pb-24 md:pb-10">
            <div className="flex items-center gap-3 px-[18px] md:px-[30px] py-[13px] border-b border-[var(--line)] text-[12.5px]">
                <Link
                    href="/rankings"
                    className="tdx-focus-ring rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    Rankings
                </Link>
                <Link
                    href="/community/catalog"
                    className="tdx-focus-ring rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    Shared catalog
                </Link>
                {user && (
                    <Link
                        href="/community/submissions"
                        className="tdx-focus-ring rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        My submissions
                    </Link>
                )}
                <Link
                    href="/community/new"
                    className={buttonClasses({ size: "sm", className: "ml-auto" })}
                >
                    Add a title
                </Link>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1fr)_316px] xl:grid-cols-[minmax(0,1fr)_380px] gap-8 md:gap-[34px] px-[18px] md:px-[30px] pt-[22px] md:pt-[26px] pb-8">
                <section>
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <h1 className="text-[21px] font-medium tracking-[-0.02em]">
                            This week
                        </h1>
                        <span className="text-[12px] text-[var(--text-secondary)]">
                            {(weekCount ?? 0).toLocaleString()} episode
                            {weekCount === 1 ? "" : "s"} logged by everyone
                        </span>
                    </div>

                    {feed.length === 0 ? (
                        <p className="mt-[18px] pt-4 border-t border-[var(--line)] text-[13px] text-[var(--text-secondary)] leading-[1.55]">
                            Nothing logged yet this week. Log an episode and it
                            shows up here — never your notes, never your ratings.
                        </p>
                    ) : (
                        <div className="flex flex-col mt-[18px]">
                            {feed.map((row, i) => {
                                const profile = profiles[row.user_id];
                                const n = bigNumber(row);
                                return (
                                    <div
                                        key={row.id}
                                        className={`tdx-row rounded-md flex gap-4 px-3 py-[15px] border-t border-[var(--line)] items-start ${
                                            i === feed.length - 1
                                                ? "border-b"
                                                : ""
                                        }`}
                                    >
                                        <BigNumber
                                            size={30}
                                            tone={row.kind === "finished" ? "text" : "mute"}
                                            className="w-[52px] flex-none leading-[0.9] tracking-[-0.035em]"
                                        >
                                            {n}
                                        </BigNumber>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px]">
                                                <span className="text-[var(--accent-primary)]">
                                                    {profile
                                                        ? `@${profile.handle}`
                                                        : "a fan"}
                                                </span>{" "}
                                                {row.series ? (
                                                    <Link
                                                        href={`/series/${row.series.id}`}
                                                        className="tdx-focus-ring rounded-sm"
                                                    >
                                                        {verb(row)}
                                                    </Link>
                                                ) : (
                                                    verb(row)
                                                )}
                                            </p>
                                            <p className="text-[12px] text-[var(--text-secondary)] mt-[5px]">
                                                {subline(row)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <p className="mt-4 text-[12.5px] text-[var(--text-secondary)]">
                        Older activity is kept for 90 days
                        {!all && feed.length >= limit ? (
                            <>
                                {" — "}
                                <Link
                                    href="/community?all=1"
                                    className="text-[var(--accent-primary)]"
                                >
                                    See the full week
                                </Link>
                            </>
                        ) : (
                            "."
                        )}
                    </p>
                </section>

                <aside>
                    <p className="text-[12.5px] text-[var(--text-secondary)]">
                        Needs a hand
                    </p>
                    {needsHand.length === 0 ? (
                        <p className="mt-3 pt-[13px] border-t border-[var(--line)] text-[12px] text-[var(--text-muted)]">
                            Every title has art. Nice.
                        </p>
                    ) : (
                        <div className="mt-3 flex flex-col gap-[11px]">
                            {needsHand.map((s) => (
                                <div
                                    key={s.id}
                                    className="pt-[13px] pb-[13px] border-t border-[var(--line)]"
                                >
                                    <Link
                                        href={`/series/${s.id}`}
                                        className="tdx-focus-ring rounded-sm text-[13.5px]"
                                    >
                                        {s.title}
                                    </Link>
                                    <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                                        No poster
                                        {s.missing
                                            ? `, ${s.missing} episode${s.missing === 1 ? "" : "s"} missing titles`
                                            : ""}
                                    </p>
                                    <Link
                                        href={`/community/new?id=${s.id}`}
                                        className={buttonClasses({
                                            variant: "secondary",
                                            size: "sm",
                                            className: "mt-2.5",
                                        })}
                                    >
                                        Suggest a fix
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="mt-[26px] text-[12.5px] text-[var(--text-secondary)]">
                        Just you
                    </p>
                    {user ? (
                        <>
                            <div className="mt-3 pt-[13px] border-t border-[var(--line)] flex flex-col gap-[9px] text-[12.5px] text-[var(--text-secondary)]">
                                <div className="flex justify-between">
                                    <span>Episodes logged</span>
                                    <span className="text-[var(--text-primary)] tabular-nums">
                                        {logged.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Series finished</span>
                                    <span className="text-[var(--text-primary)] tabular-nums">
                                        {finished}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Corrections accepted</span>
                                    <span className="text-[var(--text-primary)] tabular-nums">
                                        {myCorrections?.length ?? 0}
                                    </span>
                                </div>
                            </div>
                            {me && !me.share_activity && (
                                <p className="mt-3 text-[11.5px] text-[var(--text-muted)] leading-[1.5]">
                                    Your activity is hidden from the feed —
                                    switch it on from{" "}
                                    <Link href="/account" className="text-[var(--accent-primary)]">
                                        Account
                                    </Link>
                                    .
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="mt-3 pt-[13px] border-t border-[var(--line)] text-[12.5px] text-[var(--text-secondary)] leading-[1.55]">
                            <Link href="/login" className="text-[var(--accent-primary)]">
                                Sign in
                            </Link>{" "}
                            to see your own numbers here.
                        </p>
                    )}
                </aside>
            </div>
            <HairlineRule />
        </div>
    );
}
