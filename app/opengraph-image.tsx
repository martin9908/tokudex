import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TokuDex — Tokusatsu, Anime & Movies";

export default function OpengraphImage() {
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#272c37",
                color: "#eceef2",
            }}
        >
            <div style={{ fontSize: 104, fontWeight: 500, letterSpacing: -3 }}>
                TokuDex
            </div>
            <div style={{ fontSize: 38, color: "#c2564e", marginTop: 12 }}>
                Tokusatsu, Anime & Movies
            </div>
        </div>,
        { ...size },
    );
}
