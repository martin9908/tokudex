import Link from "next/link";

export const metadata = {
    title: "Privacy Policy — TokuDex",
};

// NOTE: This is a starting-point policy for an MVP, not legal advice. Review it
// (and have it checked) before relying on it for a public launch. Fill in the
// contact email and effective date.
export default function PrivacyPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 pb-24 md:pb-10 w-full">
            <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
                ← Back
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-1 text-sm text-cyan-200/60">Last updated: 29 June 2026</p>

            <div className="mt-6 space-y-6 text-sm leading-relaxed text-cyan-100/85">
                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">What we collect</h2>
                    <ul className="list-disc pl-5 space-y-1 text-cyan-100/80">
                        <li>Your email address and (optionally) a display name.</li>
                        <li>Your password, stored only as a salted hash by our auth provider — we never see it.</li>
                        <li>Your tracking data: which series you track, episode progress, status, and any recap notes you write.</li>
                        <li>Basic, privacy-friendly usage analytics (aggregate page views) with no advertising cookies.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">How we use it</h2>
                    <p>
                        Solely to provide TokuDex: authenticating you, saving your progress and notes,
                        and improving the product. We do not sell your data or share it with advertisers.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Where it lives</h2>
                    <p>
                        Data is stored with our infrastructure providers (Supabase for the database and
                        authentication; Vercel for hosting). Access is restricted to your own account
                        through row-level security.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Your control</h2>
                    <p>
                        You can edit your name and password, and permanently delete your account at any
                        time from your{" "}
                        <Link href="/account" className="text-cyan-300 hover:text-cyan-200">
                            account page
                        </Link>
                        . Deleting your account erases your progress, notes, and profile.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-cyan-50 mb-2">Contact</h2>
                    <p>
                        Questions about your data? Contact us at{" "}
                        <span className="text-cyan-200">[your-contact-email]</span>.
                    </p>
                </section>
            </div>
        </div>
    );
}
