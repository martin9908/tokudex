import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row Level Security — use ONLY in
 * trusted server code (server actions / route handlers), never in the browser,
 * and never expose the key to the client.
 *
 * Requires the SUPABASE_SERVICE_ROLE_KEY env var (Supabase → Settings → API).
 * Add it to .env.local and to the Vercel project's environment variables.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            "Service role not configured. Set SUPABASE_SERVICE_ROLE_KEY in the environment."
        );
    }

    return createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
