import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureReferralCode, getReferralCount } from "@/lib/referrals";
import { absoluteUrl } from "@/lib/seo";
import { ProgressBar } from "../components/atoms";
import InviteActions from "./InviteActions";

export const metadata: Metadata = {
    title: "Invite Friends",
    robots: { index: false, follow: false },
};

export default async function InvitePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const code = await ensureReferralCode();
    const count = await getReferralCount(user.id);
    const url = code ? absoluteUrl(`/?ref=${code}`) : absoluteUrl("/");

    // Recruiter reward tiers: 1 (Recruiter) and 3 (Ambassador).
    const nextTarget = count < 1 ? 1 : count < 3 ? 3 : null;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-10 w-full space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invite friends</h1>
                <p className="text-sm text-cyan-200/70 mt-1">
                    Share TokuDex with fellow fans. When someone signs up with your link, you earn the
                    Recruiter badge.
                </p>
            </div>

            <section className="tdx-panel p-4 md:p-5 space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-wider text-cyan-200/70 mb-2">
                        Your invite link
                    </p>
                    <p className="tdx-field px-3 py-2.5 break-all select-all text-cyan-100">{url}</p>
                </div>
                <InviteActions url={url} />
            </section>

            <section className="tdx-panel p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="text-lg font-semibold">Recruits</h2>
                    <span className="text-sm text-cyan-100/80">
                        <span className="text-cyan-300 font-bold">{count}</span> joined
                    </span>
                </div>
                {nextTarget ? (
                    <>
                        <ProgressBar
                            value={count}
                            max={nextTarget}
                            label={`${count} of ${nextTarget} recruits`}
                        />
                        <p className="mt-2 text-xs text-cyan-200/70">
                            {count}/{nextTarget} toward {nextTarget === 1 ? "Recruiter" : "Ambassador"}
                        </p>
                    </>
                ) : (
                    <p className="text-xs text-cyan-200/70">
                        Ambassador unlocked — thanks for spreading the word! 🎉
                    </p>
                )}
            </section>
        </div>
    );
}
