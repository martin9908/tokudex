import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEarnedAchievements } from "@/lib/achievementState";
import NotificationsList, { type Notice } from "./NotificationsList";

export const metadata: Metadata = {
    title: "Notifications",
    robots: { index: false, follow: false },
};

/**
 * Where an admin decision reaches you. The feed is derived from the rows that
 * already exist — submission decisions, badge unlocks, recruits — so there is
 * no separate inbox to keep in sync. Nothing about other people's ratings.
 */
export default async function NotificationsPage() {
    const client = await createClient();
    const {
        data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: decisions }, { data: unlocks }, { data: recruits }, earned] =
        await Promise.all([
            client
                .from("catalog_submissions")
                .select("id, series_id, status, reason, reviewed_at, created_at, payload")
                .eq("author_id", user.id)
                .in("status", ["published", "rejected"])
                .order("reviewed_at", { ascending: false })
                .limit(50),
            client
                .from("user_achievements")
                .select("achievement_key, earned_at")
                .eq("user_id", user.id)
                .order("earned_at", { ascending: false })
                .limit(50),
            client
                .from("referrals")
                .select("id, created_at")
                .eq("referrer_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20),
            getEarnedAchievements(),
        ]);

    const notices: Notice[] = [];
    for (const d of decisions ?? []) {
        const title = (d.payload as { title?: string })?.title ?? "Your submission";
        const at = d.reviewed_at ?? d.created_at;
        if (d.status === "published")
            notices.push({
                id: `sub-${d.id}`,
                kind: "published",
                title: `${title} is live`,
                body: d.series_id
                    ? "Your submission was published. Anyone can track it now."
                    : "Your correction was published.",
                href: d.series_id ? `/series/${d.series_id}` : "/community",
                at,
            });
        else
            notices.push({
                id: `sub-${d.id}`,
                kind: "rejected",
                title: `${title} needs another look`,
                body: d.reason
                    ? `The reviewer said: “${d.reason}”`
                    : "The reviewer sent it back. Open it to see why.",
                href: `/community/new?resubmit=${d.id}`,
                at,
            });
    }
    for (const u of unlocks ?? []) {
        const key = u.achievement_key as string;
        const label = earned?.labels[key] ?? key;
        const isRank = key.startsWith("rank-");
        notices.push({
            id: `ach-${key}`,
            kind: key.startsWith("series-") ? "badge" : isRank ? "rank" : "milestone",
            title: isRank ? label : key.startsWith("series-") ? "Badge unlocked" : "Milestone unlocked",
            body: isRank ? "Your rank moved up with your log." : label,
            href: "/achievements",
            at: u.earned_at,
        });
    }
    const recruitRows = recruits ?? [];
    recruitRows.forEach((r, i) => {
        const nth = recruitRows.length - i;
        notices.push({
            id: `ref-${r.id}`,
            kind: "recruit",
            title: "A friend joined with your link",
            body:
                nth === 1
                    ? "Recruiter unlocked. Two more for Ambassador."
                    : nth >= 3
                      ? "Ambassador unlocked."
                      : `${3 - nth} more for Ambassador.`,
            href: "/invite",
            at: r.created_at,
        });
    });
    notices.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return <NotificationsList notices={notices.slice(0, 60)} />;
}
