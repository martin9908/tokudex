import { ImageResponse } from "next/og";
import { getShareCard, shareEmoji } from "@/lib/share";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TokuDex achievement";

export default async function ShareOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const card = await getShareCard(slug);

    const emoji = shareEmoji(card?.kind ?? "milestone");
    const subtitle = card?.subtitle ?? "Tokusatsu Episode Tracker";
    const title = card?.title ?? "TokuDex";
    const stat =
        card?.stat_value && card?.stat_label ? `${card.stat_value} ${card.stat_label}` : "";
    const who = card?.display_name ?? "";

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
                    padding: 64,
                    textAlign: "center",
                }}
            >
                <div style={{ fontSize: 120 }}>{emoji}</div>
                <div
                    style={{
                        fontSize: 26,
                        letterSpacing: 6,
                        color: "#7fdfff",
                        textTransform: "uppercase",
                        marginTop: 8,
                    }}
                >
                    {subtitle}
                </div>
                <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 16 }}>
                    {title}
                </div>
                {stat ? (
                    <div style={{ fontSize: 34, color: "#cfefff", marginTop: 20 }}>{stat}</div>
                ) : null}
                <div style={{ fontSize: 28, color: "#7fdfff", marginTop: 40 }}>
                    {who ? `${who} · TokuDex` : "TokuDex"}
                </div>
            </div>
        ),
        { ...size }
    );
}
