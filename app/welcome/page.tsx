import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestSeries } from "@/lib/guest";
import WelcomeFlow from "./WelcomeFlow";

export const metadata: Metadata = {
    title: "Welcome",
    robots: { index: false, follow: false },
};

/**
 * First run: three steps so the library is never empty. Members who already
 * track something skip straight to home.
 */
export default async function WelcomePage() {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login?mode=signup");

    const [{ count }, suggestions, { count: catalogCount }] = await Promise.all([
        client
            .from("user_series_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
        getGuestSeries(),
        client
            .from("series")
            .select("*", { count: "exact", head: true })
            .eq("hidden", false),
    ]);
    if ((count ?? 0) > 0) redirect("/");

    return (
        <WelcomeFlow
            suggestions={suggestions
                .filter((s) => s.format === "series")
                .slice(0, 3)
                .map((s) => ({
                    id: s.id,
                    title: s.title,
                    cover_image_url: s.cover_image_url,
                    total_episodes: s.total_episodes,
                    category: s.category,
                }))}
            catalogCount={catalogCount ?? 0}
        />
    );
}
