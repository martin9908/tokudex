import type { ReactNode } from "react";

export const LEGAL_CONTACT = "mjhalumsolutions@gmail.com";

/**
 * Terms and privacy share the app's type scale — an eyebrow, a title, the
 * date, then short titled sections capped at a comfortable measure.
 */
export default function LegalPage({
    title,
    updated,
    sections,
}: {
    title: string;
    updated: string;
    sections: { heading: string; body: ReactNode }[];
}) {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
            <article className="tdx-panel px-6 py-8 sm:px-10 sm:py-9">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-primary)]">
                    Legal
                </p>
                <h1 className="text-[28px] tracking-[-0.025em] mt-2.5">{title}</h1>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                    Last updated {updated}
                </p>
                <div className="mt-6 flex flex-col gap-5 max-w-[56ch]">
                    {sections.map((s) => (
                        <section key={s.heading}>
                            <h2 className="text-[15px] font-medium tracking-[-0.01em]">
                                {s.heading}
                            </h2>
                            <div className="mt-1.5 flex flex-col gap-1.5 text-[13.5px] leading-[1.65] text-[var(--text-secondary)] [&_a]:text-[var(--accent-primary)] [&_strong]:text-[var(--text-primary)] [&_strong]:font-medium">
                                {s.body}
                            </div>
                        </section>
                    ))}
                </div>
                <p className="mt-7 pt-4 border-t border-[var(--line)] text-[11.5px] text-[var(--text-muted)]">
                    Questions? Reach us at{" "}
                    <a
                        href={`mailto:${LEGAL_CONTACT}`}
                        className="text-[var(--accent-primary)]"
                    >
                        {LEGAL_CONTACT}
                    </a>
                </p>
            </article>
        </div>
    );
}
