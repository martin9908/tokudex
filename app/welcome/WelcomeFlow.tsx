"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, Medal, Info } from "@phosphor-icons/react";
import { setEpisodeProgress } from "../actions";
import { getRank, getAchievements } from "@/lib/achievements";
import { PosterImage, ProgressBar, buttonClasses } from "../components/atoms";

type Pick = {
    id: string;
    title: string;
    cover_image_url: string | null;
    total_episodes: number | null;
    category: string;
};

function Dots({ step }: { step: number }) {
    return (
        <div className="flex gap-1.5 justify-center" aria-hidden>
            {[1, 2, 3].map((n) => (
                <span
                    key={n}
                    className={`h-1.5 rounded-[3px] transition-[width] ${
                        n === step ? "w-[18px] bg-[var(--accent-primary)]" : "w-1.5 bg-[var(--line)]"
                    }`}
                />
            ))}
        </div>
    );
}

function Tile({
    s,
    selected,
    onSelect,
}: {
    s: Pick;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className="tdx-focus-ring flex flex-col gap-1.5 rounded-md text-left"
        >
            <div
                className={`relative aspect-[3/4] w-full rounded-md overflow-hidden border ${
                    selected ? "border-2 border-[var(--accent-primary)]" : "border-[var(--line)]"
                }`}
            >
                <PosterImage src={s.cover_image_url} alt={s.title} sizes="120px" />
            </div>
            <span
                className={`text-[11px] text-center w-full leading-[1.3] ${
                    selected ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                }`}
            >
                {selected ? "Selected" : s.title}
            </span>
        </button>
    );
}

export default function WelcomeFlow({
    suggestions,
    catalogCount,
}: {
    suggestions: Pick[];
    catalogCount: number;
}) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Pick[]>([]);
    const [searching, setSearching] = useState(false);
    const [pick, setPick] = useState<Pick | null>(null);
    const [episode, setEpisode] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [saving, startTransition] = useTransition();

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/series?q=${encodeURIComponent(q)}`, {
                    signal: controller.signal,
                });
                const data = await res.json();
                setResults(
                    (data.series ?? [])
                        .filter((s: Pick & { format: string }) => s.format === "series")
                        .slice(0, 6),
                );
            } catch {
                // Aborted or offline — keep whatever is shown.
            } finally {
                setSearching(false);
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    const tiles = results.length ? results : suggestions;
    const total = pick?.total_episodes ?? null;
    const max = total ?? 999;

    function save() {
        if (!pick) return;
        setError(null);
        startTransition(async () => {
            try {
                await setEpisodeProgress(pick.id, episode);
                setStep(3);
            } catch (e) {
                setError(e instanceof Error ? e.message : "That didn't save. Try again.");
            }
        });
    }

    const toku = pick?.category === "tokusatsu";
    const logged = toku ? episode : 0;
    const { current: rank, next } = getRank(logged);
    const unlocked = getAchievements({
        seriesTracked: 1,
        episodesLogged: logged,
        seriesCompleted: total !== null && episode >= total ? 1 : 0,
    }).filter((a) => a.earned);
    const rankPct = next
        ? Math.round(((logged - rank.min) / (next.min - rank.min)) * 100)
        : 100;

    return (
        <div className="max-w-[420px] mx-auto px-5 py-7 pb-24 min-h-[calc(100dvh-60px)] flex flex-col">
            <div className="flex items-center gap-2.5">
                <span className="font-semibold text-[17px] leading-none tracking-[-0.035em]">
                    Toku<span className="text-[var(--accent-primary)]">Dex</span>
                </span>
                {step === 1 ? (
                    <Link
                        href="/"
                        className="ml-auto text-[11.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        Skip
                    </Link>
                ) : step === 2 ? (
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="ml-auto text-[11.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        Back
                    </button>
                ) : null}
            </div>

            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-primary)] mt-8">
                Step {step} of 3
            </p>

            {step === 1 && (
                <>
                    <h1 className="text-[23px] font-medium tracking-[-0.02em] leading-[1.2] mt-2.5">
                        Pick a series you&apos;re watching
                    </h1>
                    <p className="text-[13px] leading-[1.55] text-[var(--text-secondary)] mt-2.5">
                        Search the catalog or start from what everyone&apos;s on.
                        You can add more later.
                    </p>
                    <label className="mt-5 flex items-center gap-2.5 px-3 py-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] focus-within:border-[var(--accent-primary)] text-[13px] transition-colors">
                        <MagnifyingGlass size={15} className="text-[var(--text-muted)]" aria-hidden />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (e.target.value.trim().length < 2) setResults([]);
                            }}
                            placeholder={`Search ${catalogCount} titles`}
                            aria-label="Search titles"
                            className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-[var(--text-muted)]"
                        />
                    </label>
                    <div className="grid grid-cols-3 gap-2.5 mt-3.5" aria-busy={searching}>
                        {tiles.map((s) => (
                            <Tile
                                key={s.id}
                                s={s}
                                selected={pick?.id === s.id}
                                onSelect={() => {
                                    setPick(s);
                                    setEpisode(0);
                                }}
                            />
                        ))}
                    </div>
                    {query.trim().length >= 2 && !searching && results.length === 0 && (
                        <p className="text-xs text-[var(--text-muted)] mt-3">
                            No series match. Showing popular picks instead.
                        </p>
                    )}
                    <div className="mt-auto pt-5">
                        <Dots step={1} />
                        <button
                            type="button"
                            disabled={!pick}
                            onClick={() => setStep(2)}
                            className={buttonClasses({ size: "lg", className: "w-full mt-4" })}
                        >
                            Continue
                        </button>
                    </div>
                </>
            )}

            {step === 2 && pick && (
                <>
                    <h1 className="text-[23px] font-medium tracking-[-0.02em] leading-[1.2] mt-2.5">
                        Where did you stop?
                    </h1>
                    <p className="text-[13px] leading-[1.55] text-[var(--text-secondary)] mt-2.5">
                        Set the episode you&apos;re on. Everything before it counts
                        as watched — no tapping through {total ?? "the"} rows.
                    </p>
                    <div className="tdx-panel p-4 mt-5">
                        <p className="text-[13px] font-medium">{pick.title}</p>
                        <div className="flex items-center gap-3.5 mt-3.5">
                            <button
                                type="button"
                                aria-label="One episode earlier"
                                onClick={() => setEpisode((n) => Math.max(0, n - 1))}
                                className={buttonClasses({ variant: "secondary", size: "lg", className: "w-12 text-[17px]" })}
                            >
                                –
                            </button>
                            <div className="flex-1 text-center">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    max={max}
                                    value={episode}
                                    onChange={(e) =>
                                        setEpisode(
                                            Math.max(0, Math.min(max, Number(e.target.value) || 0)),
                                        )
                                    }
                                    aria-label="Episodes watched"
                                    className="w-24 bg-transparent text-center text-[30px] font-medium leading-none outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                                    {total ? `of ${total} episodes` : "episodes watched"}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="One episode later"
                                onClick={() => setEpisode((n) => Math.min(max, n + 1))}
                                className={buttonClasses({ variant: "secondary", size: "lg", className: "w-12 text-[17px]" })}
                            >
                                +
                            </button>
                        </div>
                        {total && (
                            <ProgressBar value={episode} max={total} size="md" className="mt-3.5" />
                        )}
                        <p className="text-[11.5px] text-[var(--text-secondary)] mt-2">
                            {episode === 0
                                ? "Nothing marked yet — it'll go to Plan to watch"
                                : total && episode >= total
                                  ? "All episodes marked watched — finished!"
                                  : `Episodes 1–${episode} marked watched`}
                        </p>
                    </div>
                    <div className="tdx-callout tdx-callout-quiet items-center mt-3">
                        <Info size={15} aria-hidden />
                        Haven&apos;t started it? Set 0 and it goes to Plan to watch.
                    </div>
                    {error && <div className="tdx-callout tdx-callout-warn mt-3">{error}</div>}
                    <div className="mt-auto pt-5">
                        <Dots step={2} />
                        <button
                            type="button"
                            disabled={saving}
                            onClick={save}
                            className={buttonClasses({ size: "lg", className: "w-full mt-4" })}
                        >
                            {saving ? "Saving…" : "Continue"}
                        </button>
                    </div>
                </>
            )}

            {step === 3 && pick && (
                <>
                    <h1 className="text-[23px] font-medium tracking-[-0.02em] leading-[1.2] mt-2.5">
                        Ranks and badges follow your log
                    </h1>
                    <p className="text-[13px] leading-[1.55] text-[var(--text-secondary)] mt-2.5">
                        Every tokusatsu episode you log moves your rank. Finish a
                        series and its badge unlocks. Ratings stay private — only
                        the average is public.
                    </p>
                    <div className="tdx-panel p-4 mt-5">
                        <div className="flex items-center gap-2.5">
                            <Medal size={18} weight="fill" className="text-[var(--accent-primary)]" aria-hidden />
                            <span className="text-[13px] font-medium">{rank.title}</span>
                            <span className="ml-auto text-[11.5px] text-[var(--text-secondary)]">
                                {logged} episode{logged === 1 ? "" : "s"}
                            </span>
                        </div>
                        <ProgressBar value={rankPct} max={100} size="md" className="mt-3" />
                        <p className="text-[11.5px] text-[var(--text-secondary)] mt-2">
                            {next
                                ? `${next.min - logged} more to ${next.title}`
                                : "Top rank reached"}
                            {!toku && " — anime and movies count in totals, not ranks"}
                        </p>
                    </div>
                    {unlocked.length > 0 && (
                        <div className="grid grid-cols-2 gap-2.5 mt-3">
                            {unlocked.slice(0, 2).map((a) => (
                                <div
                                    key={a.key}
                                    className="tdx-panel p-3 border-l-[3px] border-l-[var(--accent-primary)]"
                                >
                                    <Medal size={16} weight="fill" className="text-[var(--accent-primary)]" aria-hidden />
                                    <p className="text-xs font-medium mt-2">{a.label}</p>
                                    <p className="text-[11px] text-[var(--accent-primary)] mt-1">
                                        Just unlocked
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-auto pt-5">
                        <Dots step={3} />
                        <button
                            type="button"
                            onClick={() => {
                                router.push("/");
                                router.refresh();
                            }}
                            className={buttonClasses({ size: "lg", className: "w-full mt-4" })}
                        >
                            Start tracking
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
