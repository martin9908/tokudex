import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // Gated routes redirect to /login and hold no indexable content.
            disallow: [
                "/account",
                "/watch",
                "/achievements",
                "/api/",
                "/auth",
                "/login",
                "/reset-password",
            ],
        },
        sitemap: absoluteUrl("/sitemap.xml"),
        host: SITE_URL,
    };
}
