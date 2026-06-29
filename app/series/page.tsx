"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useEffect } from "react";
import SeriesCard from "../components/SeriesCard";
import tokudexIcon from "../../assets/tokudex_icon.png";

type Franchise = string;

function getReleaseYear(series: Series): number {
    const originalRunYear = series.original_run?.match(/(19|20)\d{2}/)?.[0];
    if (originalRunYear) return Number(originalRunYear);

    const copyrightYear = series.copyright_notice?.match(/(19|20)\d{2}/)?.[0];
    if (copyrightYear) return Number(copyrightYear);

    return 0;
}

type Series = {
    id: string;
    title: string;
    franchise: string | null;
    total_episodes: number | null;
    synopsis: string | null;
    created_at: string | null;
    cover_image_url: string | null;
    copyright_notice: string | null;
    original_run: string | null;
};

type ApiResponse = {
    series: Series[];
    progress: Record<string, number>;
};

function SeriesListContent() {
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
    const [activeFilter, setActiveFilter] = useState<"All" | Franchise>("All");
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch("/api/series");
                if (!response.ok) throw new Error("Failed to fetch series");
                const json = await response.json();
                setData(json);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
                setData(null);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Get unique franchises from data
    const filters = useMemo(() => {
        if (!data?.series) return ["All"];
        const franchises = new Set(
            data.series
                .map((s) => s.franchise)
                .filter((f): f is string => f !== null && f !== undefined)
        );
        return ["All", ...Array.from(franchises).sort()] as (string | "All")[];
    }, [data]);

    const progressMap = useMemo(
        () => new Map(Object.entries(data?.progress || {}).map(([id, ep]) => [id, ep])),
        [data]
    );

    const filteredSeries = useMemo(() => {
        if (!data?.series) return [];
        return data.series
            .filter((series) => {
                const matchesFranchise =
                    activeFilter === "All" || series.franchise === activeFilter;
                const matchesSearch =
                    series.title?.toLowerCase().includes(search.toLowerCase()) ||
                    series.synopsis?.toLowerCase().includes(search.toLowerCase());
                return matchesFranchise && matchesSearch;
            })
            .sort((a, b) => getReleaseYear(b) - getReleaseYear(a));
    }, [activeFilter, search, data]);

    const featuredSeries = filteredSeries[0];
    const featuredProgress = featuredSeries
        ? progressMap.get(featuredSeries.id) ?? 0
        : 0;

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-6 w-full">
                <p className="text-cyan-200/70">Loading series...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-6 w-full">
                <p className="text-red-400/90">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10 w-full space-y-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Series Library</h1>
                <p className="text-sm text-cyan-200/70 mt-1">
                    Browse the catalog and track your progress. TokuDex is an episode tracker — it doesn&apos;t stream episodes.
                </p>
            </div>
            <div className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 backdrop-blur-xl px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search series..."
                        className="w-full rounded-xl border border-cyan-900/50 bg-[#06111d]/90 pl-11 pr-3 py-3 text-sm text-cyan-50 placeholder:text-cyan-200/40 outline-none focus:ring-2 focus:ring-cyan-500/60"
                    />
                    <span
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300"
                        aria-hidden
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            <path
                                d="M21 21L16.65 16.65"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                </div>
                <select
                    value={activeFilter}
                    onChange={(event) =>
                        setActiveFilter(event.target.value as "All" | Franchise)
                    }
                    className="sm:w-56 rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-3 text-sm text-cyan-50 outline-none focus:ring-2 focus:ring-cyan-500/60"
                >
                    {filters.map((filter) => (
                        <option key={filter} value={filter}>
                            {filter === "All" ? "All Franchises" : filter}
                        </option>
                    ))}
                </select>
            </div>

            {featuredSeries ? (
                <>
                    <section className="relative overflow-hidden rounded-3xl border border-cyan-900/60 bg-[#050d17] min-h-[380px] md:min-h-[560px]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(23,95,140,0.45),transparent_48%),radial-gradient(circle_at_22%_75%,rgba(8,167,212,0.12),transparent_42%),linear-gradient(118deg,#020913_8%,#081b2b_54%,#030912_100%)]" />
                        <div className="pointer-events-none absolute inset-y-0 right-6 z-[1] hidden md:flex items-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-2xl" />
                                <div className="relative h-[320px] w-[220px] overflow-hidden rounded-2xl border border-cyan-700/45 bg-[#071321]/70 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                                    {featuredSeries.cover_image_url ? (
                                        <Image
                                            src={featuredSeries.cover_image_url}
                                            alt={featuredSeries.title}
                                            fill
                                            sizes="220px"
                                            className="object-cover object-center"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Image src={tokudexIcon} alt="" className="w-24 h-24 opacity-80" />
                                        </div>
                                    )}
                                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,19,0.06)_0%,rgba(2,9,19,0.3)_70%,rgba(2,9,19,0.52)_100%)]" />
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 p-6 md:p-9 h-full flex flex-col">
                            <div className="max-w-2xl">
                                <p className="text-xs tracking-[0.35em] text-cyan-300/80 font-semibold uppercase mb-5">
                                    {featuredSeries.franchise || "Series"}
                                </p>
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase leading-[0.95] mb-4">
                                    {featuredSeries.title}
                                </h1>

                                <div className="rounded-2xl border border-cyan-900/50 bg-[#0c1622]/70 px-4 py-3 mb-6 flex items-center justify-between max-w-md">
                                    <div>
                                        <p className="text-sm text-cyan-100 font-semibold">
                                            Tracker Actions
                                        </p>
                                        <p className="text-xs text-cyan-200/75">Log progress or open details</p>
                                    </div>
                                    <Link
                                        href={`/series/${featuredSeries.id}`}
                                        className="text-cyan-300 text-sm font-semibold"
                                    >
                                        Open
                                    </Link>
                                </div>

                                <p className="text-cyan-50/85 text-lg leading-relaxed max-w-xl mb-6">
                                    {featuredSeries.synopsis}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cyan-200/80">
                                    {featuredSeries.original_run && (
                                        <>
                                            <span>{featuredSeries.original_run}</span>
                                            <span className="opacity-40">|</span>
                                        </>
                                    )}
                                    <span>{featuredSeries.total_episodes || "?"} Episodes</span>
                                    {featuredSeries.franchise && (
                                        <>
                                            <span className="opacity-40">|</span>
                                            <span>{featuredSeries.franchise}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-7 rounded-2xl max-w-2xl border border-cyan-900/40 bg-[#071627]/65 p-5">
                                <p className="text-[11px] tracking-[0.28em] uppercase text-cyan-200/75 mb-4">
                                    Tracking Overview
                                </p>
                                <div className="flex flex-wrap items-end gap-x-4 gap-y-2 mb-4">
                                    <p className="text-5xl font-bold text-cyan-300 leading-none">
                                        {featuredProgress}
                                    </p>
                                    <p className="text-xl text-cyan-50/70 mb-1">/ {featuredSeries.total_episodes || "?"}</p>
                                    <p className="text-cyan-100/70 mb-1">Episodes tracked in this series</p>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={Math.round((featuredProgress / (featuredSeries.total_episodes || 1)) * 100)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`${featuredProgress} of ${featuredSeries.total_episodes || "?"} episodes tracked`}
                                    className="h-2 w-full rounded-full bg-cyan-950/80 overflow-hidden"
                                >
                                    <div
                                        className="h-full bg-[linear-gradient(90deg,#09d4ff_0%,#09d4ff_82%,#123046_82%)]"
                                        style={{ width: `${Math.round((featuredProgress / (featuredSeries.total_episodes || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                        <article className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 md:p-5">
                            <p className="text-cyan-100 text-lg font-semibold mb-4">
                                Progress Overview
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-cyan-300 font-semibold mb-1">
                                        Episode {featuredProgress}
                                    </p>
                                    <p className="text-cyan-50/70 text-sm">
                                        of {featuredSeries.total_episodes || "?"} episodes tracked
                                    </p>
                                </div>
                                <Link
                                    href={`/series/${featuredSeries.id}`}
                                    className="inline-flex w-full justify-center rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-[#031018] px-4 py-2 text-sm font-semibold transition-colors"
                                >
                                    Open Tracker &gt;
                                </Link>
                            </div>
                        </article>

                        <aside className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-4 md:p-5">
                            <p className="text-cyan-100 text-lg font-semibold mb-4">
                                About The Series
                            </p>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-cyan-200/75">Franchise</dt>
                                    <dd className="text-cyan-100">{featuredSeries.franchise || "N/A"}</dd>
                                </div>
                                <div>
                                    <dt className="text-cyan-200/75">Total Episodes</dt>
                                    <dd className="text-cyan-100">{featuredSeries.total_episodes || "N/A"}</dd>
                                </div>
                                <div>
                                    <dt className="text-cyan-200/75">Original Run</dt>
                                    <dd className="text-cyan-100">
                                        {featuredSeries.original_run || "N/A"}
                                    </dd>
                                </div>
                            </dl>
                        </aside>
                    </section>

                    <section className="pt-3">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-cyan-50">More Series</h2>
                            <p className="text-xs text-cyan-200/75">Library</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredSeries.map((series) => (
                                <SeriesCard
                                    key={series.id}
                                    id={series.id}
                                    title={series.title}
                                    totalEpisodes={series.total_episodes || 0}
                                    watchedEpisodes={progressMap.get(series.id) ?? 0}
                                    franchise={series.franchise || ""}
                                    synopsis={series.synopsis || ""}
                                    thumbnailUrl={series.cover_image_url}
                                    copyrightNotice={series.copyright_notice}
                                />
                            ))}
                        </div>
                    </section>
                </>
            ) : (
                <p className="text-sm text-cyan-200/70">
                    No series match this search and filter combination.
                </p>
            )}
        </div>
    );
}

export default function SeriesListPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-6xl mx-auto px-4 py-6 w-full">
                    <p className="text-cyan-200/70">Loading series...</p>
                </div>
            }
        >
            <SeriesListContent />
        </Suspense>
    );
}
