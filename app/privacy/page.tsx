import Link from "next/link";
import LegalPage from "../components/organisms/LegalPage";

export const metadata = {
    title: "Privacy",
};

// NOTE: This is a starting-point policy for an MVP, not legal advice. Review it
// (and have it checked) before relying on it for a public launch.
export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy"
            updated="14 September 2026"
            sections={[
                {
                    heading: "What we store",
                    body: (
                        <>
                            <p>
                                An email address, an optional display name, and
                                your tracking data: which titles you track,
                                episode progress and when you logged it, your
                                statuses, your private notes and your ratings.
                            </p>
                            <p>
                                Your password is stored only as a salted hash by
                                our auth provider — we never see it. Catalog
                                submissions, source links, content reports and
                                any publishing-trust grant are kept with your
                                account. Usage analytics are aggregate page
                                views with no advertising cookies.
                            </p>
                        </>
                    ),
                },
                {
                    heading: "What stays private",
                    body: (
                        <>
                            <p>
                                Your notes and your individual ratings are never
                                shown to anyone else, and never appear on a share
                                card. Only aggregate numbers — averages, vote
                                counts, rankings — are public.
                            </p>
                            <p>
                                Your display name appears on share cards you
                                create yourself and nowhere else. Administrators
                                can review submissions, reports, revision history
                                and publishing-trust records.
                            </p>
                        </>
                    ),
                },
                {
                    heading: "Where it lives",
                    body: (
                        <p>
                            Data is stored with our infrastructure providers —
                            Supabase for the database and authentication, Vercel
                            for hosting. We do not sell your data or share it
                            with advertisers.
                        </p>
                    ),
                },
                {
                    heading: "Guests",
                    body: (
                        <p>
                            Without an account you can browse the catalog, but
                            nothing is recorded. Ratings, rankings and
                            achievements need an account.
                        </p>
                    ),
                },
                {
                    heading: "Email",
                    body: (
                        <p>
                            We send account email only — sign-in links and
                            password resets. Submission decisions reach you
                            in-app on My submissions.
                        </p>
                    ),
                },
                {
                    heading: "Deletion",
                    body: (
                        <p>
                            You can edit your name and password, and permanently
                            delete your account at any time from your{" "}
                            <Link href="/account">account page</Link>. Deleting
                            your account removes your rows for good, including
                            the ratings behind public averages. Catalog
                            contributions and moderation history remain, with
                            their account attribution removed.
                        </p>
                    ),
                },
            ]}
        />
    );
}
