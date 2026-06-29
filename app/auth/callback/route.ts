import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

// Handles the redirect after a user clicks an email confirmation/magic-link.
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    // Only allow same-origin relative paths. Reject protocol-relative ("//evil")
    // and backslash ("/\evil") forms that browsers can treat as off-site.
    const requestedNext = searchParams.get("next") ?? "/";
    const next =
        requestedNext.startsWith("/") &&
        !requestedNext.startsWith("//") &&
        !requestedNext.startsWith("/\\")
            ? requestedNext
            : "/";

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
