import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "TokuDex — Tokusatsu Episode Tracker",
        short_name: SITE_NAME,
        description: SITE_DESCRIPTION,
        start_url: "/",
        display: "standalone",
        background_color: "#060b13",
        theme_color: "#060b13",
        icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
}
