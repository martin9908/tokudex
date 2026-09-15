import { ImageResponse } from "next/og";
import { getShareCard } from "@/lib/share";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TokuDex achievement";

// Slate palette, hero-red accent — matches the app's dark theme tokens.
const BG = "#272c37";
const TEXT = "#eceef2";
const MUTE = "#99a1b0";
const ACCENT = "#c2564e";

export default async function ShareOpengraphImage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const card = await getShareCard(slug);

    const eyebrow = card?.title ?? "TokuDex";
    const headline =
        card?.stat_value && card?.stat_label
            ? `${card.stat_value} ${card.stat_label}`
            : (card?.subtitle ?? "Tokusatsu episode tracker");
    const who = card?.display_name ?? "";

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: BG,
                    color: TEXT,
                    padding: "68px 76px",
                    fontFamily: "Inter, system-ui, sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                    <div style={{ display: "flex", fontSize: 42, fontWeight: 600, letterSpacing: -1.5 }}>
                        <span>Toku</span>
                        <span style={{ color: ACCENT }}>Dex</span>
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            letterSpacing: 4,
                            textTransform: "uppercase",
                            color: MUTE,
                        }}
                    >
                        Episode tracker
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            fontSize: 24,
                            letterSpacing: 4,
                            textTransform: "uppercase",
                            color: ACCENT,
                        }}
                    >
                        {eyebrow}
                    </div>
                    <div
                        style={{
                            fontSize: 84,
                            fontWeight: 500,
                            letterSpacing: -2,
                            lineHeight: 1.05,
                            marginTop: 20,
                            maxWidth: 1000,
                        }}
                    >
                        {headline}
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ fontSize: 28, color: MUTE }}>{who}</div>
                    <div style={{ fontSize: 26, color: ACCENT }}>tokudex.app</div>
                </div>
            </div>
        ),
        { ...size },
    );
}
