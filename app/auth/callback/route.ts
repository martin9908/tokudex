import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

// Handles the redirect after a user clicks an email confirmation/magic-link.
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Could not authenticate — try again.")}`
    );
}
