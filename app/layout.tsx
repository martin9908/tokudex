import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";
import Navbar from "./components/organisms/Navbar";
import MobileTabBar from "./components/organisms/MobileTabBar";
import AchievementToaster from "./components/organisms/AchievementToaster";
import JsonLd from "./components/JsonLd";
import { getEarnedAchievements } from "@/lib/achievementState";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TokuDex — Tokusatsu Episode Tracker",
    template: "%s · TokuDex",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "tokusatsu",
    "Kamen Rider",
    "Super Sentai",
    "Ultraman",
    "episode tracker",
    "watch order",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "TokuDex — Tokusatsu Episode Tracker",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "TokuDex — Tokusatsu Episode Tracker",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060b13",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const achievementState = await getEarnedAchievements();

  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: absoluteUrl("/logo.png"),
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <MobileTabBar />
        {achievementState && (
          <AchievementToaster
            earned={achievementState.earned}
            labels={achievementState.labels}
          />
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
