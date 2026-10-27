import { createClient } from "./supabase/server";

/**
 * Public profiles: the handle other members see in the community feed and the
 * "added by" credit on the shared catalog. Everything else about a member
 * stays private.
 */
export type Profile = {
    user_id: string;
    handle: string;
    display_name: string | null;
    share_activity: boolean;
};

export async function getProfile(userId: string): Promise<Profile | null> {
    const client = await createClient();
    const { data } = await client
        .from("profiles")
        .select("user_id,handle,display_name,share_activity")
        .eq("user_id", userId)
        .maybeSingle();
    return (data as Profile | null) ?? null;
}

export async function getProfilesByIds(
    ids: string[],
): Promise<Record<string, Profile>> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (!unique.length) return {};
    const client = await createClient();
    const { data } = await client
        .from("profiles")
        .select("user_id,handle,display_name,share_activity")
        .in("user_id", unique);
    return Object.fromEntries(
        ((data ?? []) as Profile[]).map((p) => [p.user_id, p]),
    );
}

/** A handle candidate from a display name or email: lowercase, [a-z0-9_], 3–20. */
export function deriveHandle(
    name: string | null | undefined,
    email: string | null | undefined,
): string {
    const source = (name?.trim() || email?.split("@")[0] || "fan")
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 16);
    return source.length >= 3 ? source : `${source}fan`.slice(0, 16);
}

/**
 * Gives the signed-in member a profile if they have none yet, deriving a
 * handle and appending digits until one is free. Safe to call on every
 * sign-in.
 */
export async function ensureProfile(): Promise<Profile | null> {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) return null;
    const existing = await getProfile(user.id);
    if (existing) return existing;
    const display =
        (user.user_metadata?.full_name as string | undefined)?.trim() || null;
    const base = deriveHandle(display, user.email);
    for (let attempt = 0; attempt < 6; attempt++) {
        const handle =
            attempt === 0
                ? base
                : `${base.slice(0, 20 - 4)}${Math.floor(Math.random() * 9000 + 1000)}`;
        const { data, error } = await client.rpc("set_profile", {
            p_handle: handle,
            p_display: display,
            p_share_activity: null,
        });
        if (!error) return data as Profile;
        if (!/taken/i.test(error.message)) return null;
    }
    return null;
}
