import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TokuDex — Tokusatsu Episode Tracker";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg,#020913,#081b2b)",
                    color: "#ffffff",
                }}
            >
                <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3 }}>TokuDex</div>
                <div style={{ fontSize: 38, color: "#7fdfff", marginTop: 12 }}>
                    Tokusatsu Episode Tracker
                </div>
            </div>
        ),
        { ...size }
    );
}
