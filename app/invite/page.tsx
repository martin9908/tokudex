import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/supabase/server";
import { ensureReferralCode } from "@/lib/referrals";
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

    const [code, { data: recruits }] = await Promise.all([
        ensureReferralCode(),
        supabase
            .from("referrals")
            .select("id, created_at")
            .eq("referrer_id", user.id)
            .order("created_at", { ascending: false }),
    ]);
    const count = recruits?.length ?? 0;
    const url = code ? absoluteUrl(`/?ref=${code}`) : absoluteUrl("/");

    // Recruiter reward tiers: 1 (Recruiter) and 3 (Ambassador).
    const nextTarget = count < 1 ? 1 : count < 3 ? 3 : null;
    const remaining = nextTarget ? nextTarget - count : 0;

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 w-full">
            <h1 className="text-[22px] tracking-[-0.02em]">Invite friends</h1>
            <p className="text-[13px] leading-[1.55] text-[var(--text-secondary)] mt-2 mb-4 max-w-[440px]">
                Share TokuDex with fellow fans. When someone signs up with
                your link, you earn the Recruiter badge.
            </p>

            <section className="tdx-panel p-4">
                <p className="tdx-eyebrow">Your invite link</p>
                <p className="mt-2 px-3 py-2.5 rounded-md bg-[var(--background)] border border-[var(--line)] text-[13px] break-all select-all text-[var(--accent-text)]">
                    {url}
                </p>
                <div className="mt-3">
                    <InviteActions url={url} />
                </div>
            </section>

            <section className="tdx-panel p-4 mt-3.5">
                <div className="flex items-center gap-2.5">
                    <span className="tdx-eyebrow">Recruits</span>
                    <span className="ml-auto text-[12.5px] text-[var(--text-secondary)]">
                        <span className="text-[var(--accent-text)] font-medium">
                            {count}
                        </span>{" "}
                        joined
                    </span>
                </div>
                <ProgressBar
                    value={count}
                    max={nextTarget ?? 3}
                    size="md"
                    className="mt-2.5"
                    label={
                        nextTarget
                            ? `${count} of ${nextTarget} recruits`
                            : "Ambassador unlocked"
                    }
                />
                <div className="flex justify-between mt-1.5 text-[11.5px] text-[var(--text-secondary)]">
                    <span>
                        {nextTarget
                            ? `${count} of ${nextTarget} toward ${nextTarget === 1 ? "Recruiter" : "Ambassador"}`
                            : "Ambassador unlocked — thanks for spreading the word"}
                    </span>
                    {count >= 1 && (
                        <span className="text-[var(--accent-primary)]">
                            {count >= 3 ? "Ambassador earned" : "Recruiter earned"}
                        </span>
                    )}
                </div>
                <div className="mt-3.5 flex flex-col gap-2">
                    {(recruits ?? []).map((r, i) => (
                        <div
                            key={r.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[var(--background)] border border-[var(--line)]"
                        >
                            <div className="w-[26px] h-[26px] rounded-full bg-[var(--accent-tint)] text-[var(--accent-on)] grid place-items-center text-[10px] font-semibold flex-none">
                                {count - i}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px]">A fan joined with your link</p>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                    Joined{" "}
                                    {new Date(r.created_at).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {nextTarget && (
                        <div className="tdx-callout tdx-callout-quiet items-center">
                            <UserPlus size={15} aria-hidden />
                            {remaining === 1 ? "One more" : `${remaining} more`} to
                            unlock {nextTarget === 1 ? "Recruiter" : "Ambassador"}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
