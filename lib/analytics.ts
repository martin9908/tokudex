import "server-only";
import { track } from "@vercel/analytics/server";

/**
 * Centralized, typed growth-funnel events. Server-side only (called from server
 * actions and route handlers). Client-side share events are tracked separately
 * from client components via `@vercel/analytics`'s `track`.
 *
 * Keep props non-PII (ids/franchise, never email). Tracking is best-effort and
 * must never break the mutation that triggered it.
 */

type EventProps = Record<string, string | number | boolean | null>;

export type GrowthEvent =
    | "signup"
    | "login"
    | "add_to_tracker"
    | "log_episode"
    | "mark_done"
    | "achievement_earned"
    | "referral_signup";

export async function trackServer(event: GrowthEvent, props?: EventProps): Promise<void> {
    try {
        await track(event, props);
    } catch {
        // Analytics is best-effort; swallow errors so it never affects the request.
    }
}
