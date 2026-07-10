import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Single authoritative middleware. Responsibilities:
 *  1. Refresh the Supabase session (JWT validation via getUser, not getSession).
 *  2. Enforce route-level authentication — redirect guests away from protected pages.
 *  3. Persist referral codes (?ref=CODE) in a secure, HttpOnly cookie.
 *
 * NOTE: proxy.ts previously contained this logic but was never wired up as the
 * Next.js middleware entry-point (it exported `proxy`, not `middleware`). Route
 * guards were therefore inactive. All logic now lives here.
 */
export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Always use getUser() — validates the JWT with Supabase's server.
    // getSession() only reads the local cookie and can be spoofed.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // ── Route guards ────────────────────────────────────────────────────────
    // Guests may read public/SEO-facing pages; everything else requires auth.
    const { pathname } = request.nextUrl;
    const isPublic =
        pathname === "/" ||
        pathname === "/series" ||
        pathname.startsWith("/series/") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/terms") ||
        pathname.startsWith("/privacy") ||
        pathname.startsWith("/share/") ||
        pathname === "/robots.txt" ||
        pathname === "/sitemap.xml" ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/opengraph-image";

    if (!user && !isPublic) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // ── Referral cookie ─────────────────────────────────────────────────────
    // Capture ?ref=CODE on public landing pages and store it as a secure,
    // HttpOnly cookie so signup can attribute the referral server-side.
    const ref = request.nextUrl.searchParams.get("ref");
    if (ref) {
        const isProduction = process.env.NODE_ENV === "production";
        supabaseResponse.cookies.set("tdx_ref", ref.slice(0, 32), {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: true,             // not readable by JavaScript
            secure: isProduction,       // HTTPS-only in production
            sameSite: "lax",
            path: "/",
        });
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all paths except Next.js internals and static assets so the
         * middleware overhead is minimal for non-page requests.
         */
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
    ],
};
