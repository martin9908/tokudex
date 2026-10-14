import { ImageResponse } from "next/og";
import { getSeriesById } from "@/lib/supabase/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Title on TokuDex";

export default async function SeriesOpengraphImage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let series: {
        title: string;
        format: string;
        category: string;
        franchise: string | null;
        total_episodes: number | null;
        cover_image_url: string | null;
    } | null = null;
    try {
        series = await getSeriesById(id);
    } catch {
        series = null;
    }

    // Pre-check the poster so a broken URL never 500s the OG route.
    let posterUrl: string | null = null;
    if (series?.cover_image_url) {
        try {
            const res = await fetch(series.cover_image_url, {
                cache: "force-cache",
            });
            if (res.ok) posterUrl = series.cover_image_url;
        } catch {
            posterUrl = null;
        }
    }

    const title = series?.title ?? "TokuDex";
    const franchise = series?.franchise ?? series?.category ?? "TokuDex";
    const episodes =
        series?.format === "movie"
            ? "Movie"
            : series?.total_episodes
              ? `${series.total_episodes} Episodes`
              : "";

    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                background: "#272c37",
                color: "#eceef2",
                padding: 64,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    flex: 1,
                }}
            >
                <div
                    style={{
                        fontSize: 26,
                        letterSpacing: 6,
                        color: "#c2564e",
                        textTransform: "uppercase",
                    }}
                >
                    {franchise}
                </div>
                <div
                    style={{
                        fontSize: 68,
                        fontWeight: 500,
                        lineHeight: 1.05,
                        marginTop: 16,
                    }}
                >
                    {title}
                </div>
                {episodes ? (
                    <div
                        style={{
                            fontSize: 32,
                            color: "#99a1b0",
                            marginTop: 24,
                        }}
                    >
                        {episodes}
                    </div>
                ) : null}
                <div style={{ fontSize: 28, color: "#c2564e", marginTop: 40 }}>
                    Track it on TokuDex
                </div>
            </div>
            {posterUrl ? (
                <img
                    src={posterUrl}
                    alt=""
                    width={330}
                    height={440}
                    style={{
                        borderRadius: 16,
                        objectFit: "cover",
                        border: "1px solid rgba(127,223,255,0.35)",
                    }}
                />
            ) : null}
        </div>,
        { ...size },
    );
}
