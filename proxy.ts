import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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

    // Always use getUser() (not getSession()) — validates the token server-side.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users away from protected routes. Guests may
    // browse the home page, the full series library, and individual series
    // pages (read-only, for SEO); account, achievements, watch, and API stay
    // members-only.
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
        // SEO / crawler + link-preview routes must be reachable by guests.
        pathname === "/robots.txt" ||
        pathname === "/sitemap.xml" ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/opengraph-image";
    if (!user && !isPublic) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Capture a referral code (?ref=CODE) so signup can attribute it. Runs on the
    // public landing pages (/, /login), before auth is required.
    const ref = request.nextUrl.searchParams.get("ref");
    if (ref) {
        supabaseResponse.cookies.set("tdx_ref", ref.slice(0, 32), {
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: true,                              // not readable by JS
            secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
            sameSite: "lax",
            path: "/",
        });
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
    ],
};
