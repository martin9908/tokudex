import { randomUUID } from "crypto";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

function generateCode(): string {
    return randomUUID().replace(/-/g, "").slice(0, 8);
}

/**
 * Returns the signed-in user's referral code, creating one on first use.
 * Returns null when logged out.
 */
export async function ensureReferralCode(): Promise<string | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: existing } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();
    if (existing?.code) return existing.code;

    const code = generateCode();
    const { error } = await supabase.from("referral_codes").insert({ user_id: user.id, code });
    if (error) {
        // Lost a race (row already exists) — re-read and return it.
        const { data } = await supabase
            .from("referral_codes")
            .select("code")
            .eq("user_id", user.id)
            .maybeSingle();
        return data?.code ?? null;
    }
    return code;
}

/**
 * Attribute a newly signed-up user to a referrer by code. Uses the service-role
 * client (the referred user can't insert a row about someone else under RLS).
 * Idempotent via the unique(referred_id) constraint; guards self-referral.
 */
export async function attributeReferral(referredUserId: string, code: string): Promise<void> {
    const trimmed = code?.trim();
    if (!trimmed) return;

    const admin = createAdminClient();
    const { data: codeRow } = await admin
        .from("referral_codes")
        .select("user_id")
        .eq("code", trimmed)
        .maybeSingle();

    const referrerId = codeRow?.user_id as string | undefined;
    if (!referrerId || referrerId === referredUserId) return; // unknown code or self-referral

    // Duplicate (already attributed) violates unique(referred_id) — ignore it.
    await admin
        .from("referrals")
        .insert({ referrer_id: referrerId, referred_id: referredUserId, code: trimmed });
}

/** Count of users attributed to `userId` (owner-scoped read). */
export async function getReferralCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", userId);
    return count ?? 0;
}
