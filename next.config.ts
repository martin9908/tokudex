import type { NextConfig } from "next";

const securityHeaders = [
    /**
     * Prevents the page from being embedded in a frame on another origin,
     * blocking clickjacking attacks.
     */
    { key: "X-Frame-Options", value: "DENY" },
    /**
     * Stops browsers from MIME-sniffing a response away from the declared
     * Content-Type, preventing drive-by download attacks.
     */
    { key: "X-Content-Type-Options", value: "nosniff" },
    /**
     * Controls how much referrer information is sent with requests. Avoids
     * leaking full URLs (which may contain tokens) to third parties.
     */
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    /**
     * Enforces HTTPS for 2 years, including subdomains, and opts in to
     * browser preload lists. Only effective over HTTPS (ignored on HTTP).
     */
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    /**
     * Restricts which browser features this page may use. Denying
     * camera/microphone/geolocation reduces the attack surface from XSS.
     */
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
    },
    /**
     * Enables the browser's built-in XSS filter (legacy browsers) and blocks
     * rendering when an XSS attack is detected.
     */
    { key: "X-XSS-Protection", value: "1; mode=block" },
    /**
     * Content-Security-Policy — controls which origins the browser is allowed
     * to contact, load scripts from, and render content from.
     *
     * Key directives:
     *  - connect-src: whitelists the only servers the page may fetch/XHR to.
     *    This is the primary defence against data exfiltration: even if XSS
     *    injects malicious code, it cannot send data to an unknown server.
     *  - script-src: 'unsafe-inline' is required by Next.js's inline hydration
     *    scripts. A nonce-based policy would remove this, but requires server-
     *    side nonce injection for every response.
     *  - img-src: Supabase Storage is the only external image origin.
     *  - frame-ancestors 'none': duplicates X-Frame-Options for CSP-aware UAs.
     *  - base-uri 'self': prevents <base> injection attacks.
     *  - form-action 'self': restricts where forms may submit to.
     */
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval' " : ""}https://va.vercel-scripts.com`,
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' data: https://vjdbddflaiuogawqggav.supabase.co",
            // Supabase Auth + DB/Storage, Vercel Analytics, Vercel Speed Insights
            `connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com ${process.env.NODE_ENV === "development" ? (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") : ""}`,
            "frame-src 'none'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
        ].join("; "),
    },
];

const nextConfig: NextConfig = {
    ...(process.env.TOKUDEX_TEST_SERVER === "1"
        ? { distDir: ".next-test" }
        : {}),
    async headers() {
        return [
            {
                // Apply security headers to every route.
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                // Supabase Storage (cover images live in a public bucket).
                protocol: "https",
                hostname: "vjdbddflaiuogawqggav.supabase.co",
                pathname: "/storage/v1/object/**",
            },
        ],
    },
};

export default nextConfig;
