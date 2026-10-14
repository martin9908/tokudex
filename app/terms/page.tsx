import LegalPage from "../components/organisms/LegalPage";

export const metadata = {
    title: "Terms of use",
};

// NOTE: Starting-point terms for an MVP, not legal advice. Review before launch
// and fill in the governing law as appropriate.
export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of use"
            updated="14 September 2026"
            sections={[
                {
                    heading: "What TokuDex is",
                    body: (
                        <p>
                            TokuDex is a tracker. It records which episodes you
                            have watched, where you stopped and what you thought
                            — it does <strong>not</strong> host, stream or link
                            to video. Series and episode information are catalog
                            metadata for tracking only; names, images and
                            trademarks belong to their respective rights holders.
                        </p>
                    ),
                },
                {
                    heading: "Your account",
                    body: (
                        <>
                            <p>
                                You need an account to log episodes, rate titles,
                                appear in rankings and earn achievements. Browsing
                                the catalog works without one.
                            </p>
                            <p>
                                Keep your password to yourself and provide
                                accurate information when signing up. If you
                                think someone else has your password, change it
                                from Account.
                            </p>
                        </>
                    ),
                },
                {
                    heading: "Acceptable use",
                    body: (
                        <p>
                            Use TokuDex for your own personal tracking. Don&apos;t
                            attempt to disrupt the service, access other
                            people&apos;s data, or use it for unlawful purposes.
                        </p>
                    ),
                },
                {
                    heading: "Contributions",
                    body: (
                        <>
                            <p>
                                Anything you submit to the catalog — titles,
                                episode lists, corrections — becomes part of a
                                shared, public catalog that other people rely on.
                                Submit only what you can point to a source for.
                                Poster art is assigned by admins from approved
                                storage.
                            </p>
                            <p>
                                An admin reviews submissions before they go live
                                and may edit or reject them. Repeatedly
                                submitting bad data ends your contributor access.
                            </p>
                        </>
                    ),
                },
                {
                    heading: "Ratings and rankings",
                    body: (
                        <p>
                            Your individual ratings and recap notes stay private.
                            Public rankings show a weighted average and a vote
                            count, never who voted what. Titles need five
                            eligible votes before they appear.
                        </p>
                    ),
                },
                {
                    heading: "Service “as is”",
                    body: (
                        <p>
                            TokuDex is provided as is, without warranties, and
                            may change or be unavailable from time to time. We
                            may suspend or terminate accounts that violate these
                            terms.
                        </p>
                    ),
                },
                {
                    heading: "Ending it",
                    body: (
                        <p>
                            You can delete your account from Account at any
                            time; your tracking data and ratings go with it.
                            Published catalog contributions stay, with your
                            account attribution removed, because other
                            people&apos;s tracking depends on them.
                        </p>
                    ),
                },
            ]}
        />
    );
}
