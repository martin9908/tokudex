import Link from "next/link";

export const metadata = {
    title: "Terms of Service — TokuDex",
};

// NOTE: Starting-point terms for an MVP, not legal advice. Review before launch
// and fill in the contact email / governing law as appropriate.
export default function TermsPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 pb-24 md:pb-10 w-full">
            <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
                ← Back
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-1 text-sm text-cyan-200/60">Last updated: 29 June 2026</p>

            <div className="mt-6 space-y-6 text-sm leading-relaxed text-cyan-100/85">
                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">What TokuDex is</h2>
                    <p>
                        TokuDex is a personal episode tracker for tokusatsu series. It helps you
                        remember where you stopped watching and what happened. It does{" "}
                        <span className="font-semibold">not</span> stream or host video — series and
                        episode information are catalog metadata for tracking only.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Your account</h2>
                    <p>
                        You&apos;re responsible for keeping your login credentials secure and for the
                        activity on your account. Provide accurate information when signing up.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Acceptable use</h2>
                    <p>
                        Use TokuDex for your own personal tracking. Don&apos;t attempt to disrupt the
                        service, access other users&apos; data, or use it for unlawful purposes.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Your content</h2>
                    <p>
                        Your recap notes belong to you. Catalog content and any series names, images,
                        or trademarks are the property of their respective rights holders and are used
                        for identification and tracking purposes only.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Service &ldquo;as is&rdquo;</h2>
                    <p>
                        TokuDex is provided as is, without warranties, and may change or be unavailable
                        from time to time. We may suspend or terminate accounts that violate these terms.
                        You can stop using the service and delete your account at any time.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Contact</h2>
                    <p>
                        Questions about these terms? Contact us at{" "}
                        <span className="text-cyan-200">[your-contact-email]</span>.
                    </p>
                </section>
            </div>
        </div>
    );
}
