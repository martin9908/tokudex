"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockSimple } from "@phosphor-icons/react";
import { rateTitle } from "@/app/community/actions";
import { buttonClasses } from "@/app/components/atoms";

/**
 * Private 1–10 rating as a row of dots. Tapping a dot saves immediately.
 * When the member isn't eligible yet, the control is replaced by the thing
 * that unlocks it rather than shown disabled.
 */
export default function TitleRating({
    id,
    initialScore,
    eligible,
    unlockLabel,
    onUnlock,
    community,
}: {
    id: string;
    initialScore: number | null;
    eligible: boolean;
    /** Button text for the gate, e.g. "Log episode 1" or "Mark watched". */
    unlockLabel: string;
    /** Where the gate button goes (a /watch URL or the detail page anchor). */
    onUnlock: string;
    community: { average: number; votes: number } | null;
}) {
    const router = useRouter();
    const [score, setScore] = useState<number | null>(initialScore);
    const [hover, setHover] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [busy, startTransition] = useTransition();

    function save(value: number | null) {
        setError("");
        const previous = score;
        setScore(value);
        startTransition(async () => {
            try {
                await rateTitle(id, value);
                router.refresh();
            } catch (e) {
                setScore(previous);
                setError(e instanceof Error ? e.message : "Could not save rating.");
            }
        });
    }

    const communityLine = community ? (
        <p className="text-xs text-[var(--text-secondary)]">
            Community average{" "}
            <span className="text-[var(--text-primary)] font-medium">
                {community.average.toFixed(1)}
            </span>{" "}
            from {community.votes} {community.votes === 1 ? "rating" : "ratings"}
        </p>
    ) : (
        <p className="text-xs text-[var(--text-secondary)]">
            Not enough ratings to show an average yet — five make it public.
        </p>
    );

    if (!eligible) {
        return (
            <section className="tdx-panel p-3.5">
                <div className="flex items-baseline gap-2">
                    <span className="tdx-eyebrow tdx-eyebrow-accent">Your rating</span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                        private — only the average is public
                    </span>
                </div>
                <div className="mt-3 p-3.5 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)]">
                    <div className="flex items-center gap-2.5 text-[13px]">
                        <LockSimple size={17} className="text-[var(--text-muted)]" />
                        {initialScore !== null
                            ? "Your rating is kept but held back from the average until you're eligible again"
                            : "Log an episode to rate this"}
                    </div>
                    <a
                        href={onUnlock}
                        className={buttonClasses({ className: "mt-3 w-full" })}
                    >
                        {unlockLabel}
                    </a>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--line)]">
                    {communityLine}
                </div>
            </section>
        );
    }

    const shown = hover ?? score ?? 0;

    return (
        <section className="tdx-panel p-3.5">
            <div className="flex items-baseline gap-2">
                <span className="tdx-eyebrow tdx-eyebrow-accent">Your rating</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                    private — only the average is public
                </span>
            </div>
            <div className="flex items-center gap-3.5 mt-3 flex-wrap">
                <div
                    role="radiogroup"
                    aria-label="Your rating out of 10"
                    className="flex gap-1.5"
                    onMouseLeave={() => setHover(null)}
                >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={score === n}
                            aria-label={`${n} out of 10`}
                            disabled={busy}
                            onMouseEnter={() => setHover(n)}
                            onFocus={() => setHover(n)}
                            onBlur={() => setHover(null)}
                            onClick={() => save(n)}
                            className={`tdx-dot tdx-focus-ring ${n <= shown ? "is-on" : ""}`}
                        />
                    ))}
                </div>
                <span className="text-[15px] font-medium">
                    {shown > 0 ? shown : "–"}
                    <span className="text-[var(--text-muted)] font-normal">/10</span>
                </span>
                {score !== null && (
                    <button
                        type="button"
                        onClick={() => save(null)}
                        disabled={busy}
                        className="tdx-focus-ring ml-auto text-[11.5px] text-[var(--accent-primary)] rounded"
                    >
                        Clear rating
                    </button>
                )}
            </div>
            {error && (
                <p role="alert" className="mt-2 text-xs text-[var(--warning)]">
                    {error}
                </p>
            )}
            <div className="mt-3 pt-3 border-t border-[var(--line)]">
                {communityLine}
            </div>
        </section>
    );
}
