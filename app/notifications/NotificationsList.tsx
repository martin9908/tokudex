"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
    CheckCircle,
    PencilSimple,
    SealCheck,
    WarningCircle,
    UserPlus,
    Medal,
} from "@phosphor-icons/react";
import { relativeTime } from "@/lib/progress";

export type Notice = {
    id: string;
    kind: "published" | "rejected" | "badge" | "milestone" | "rank" | "recruit";
    title: string;
    body: string;
    href: string;
    at: string;
};

const SEEN_KEY = "tokudex.notificationsSeen";

function subscribe(cb: () => void) {
    window.addEventListener("storage", cb);
    window.addEventListener("tdx-seen", cb);
    return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener("tdx-seen", cb);
    };
}
function readSeen(): string {
    try {
        return localStorage.getItem(SEEN_KEY) ?? "";
    } catch {
        return "";
    }
}
function markSeen() {
    try {
        localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
        // Storage blocked — "new" simply won't persist across visits.
    }
    window.dispatchEvent(new Event("tdx-seen"));
}

function Icon({ kind, fresh }: { kind: Notice["kind"]; fresh: boolean }) {
    const accent = "text-[var(--accent-primary)] mt-px flex-none";
    const muted = "text-[var(--text-secondary)] mt-px flex-none";
    switch (kind) {
        case "published":
            return <CheckCircle size={18} weight="fill" className={accent} aria-hidden />;
        case "rejected":
            return <WarningCircle size={18} className="text-[var(--warning)] mt-px flex-none" aria-hidden />;
        case "badge":
            return <SealCheck size={18} weight="fill" className={accent} aria-hidden />;
        case "milestone":
        case "rank":
            return <Medal size={18} weight={fresh ? "fill" : "regular"} className={fresh ? accent : muted} aria-hidden />;
        case "recruit":
            return <UserPlus size={18} className={fresh ? accent : muted} aria-hidden />;
        default:
            return <PencilSimple size={18} className={muted} aria-hidden />;
    }
}

/** Shows the derived feed and remembers, per device, what has been seen. */
export default function NotificationsList({ notices }: { notices: Notice[] }) {
    const seen = useSyncExternalStore(subscribe, readSeen, () => "");
    const seenAt = seen ? new Date(seen).getTime() : 0;
    const isFresh = (n: Notice) => new Date(n.at).getTime() > seenAt;
    const freshCount = notices.filter(isFresh).length;

    return (
        <div className="min-w-0">
            <div className="flex items-baseline gap-2.5">
                <h1 className="text-[20px] tracking-[-0.02em]">Notifications</h1>
                {freshCount > 0 && (
                    <span className="tdx-chip tdx-chip-accent">{freshCount} new</span>
                )}
                {freshCount > 0 && (
                    <button
                        type="button"
                        onClick={markSeen}
                        className="tdx-focus-ring ml-auto text-[11.5px] text-[var(--accent-primary)] rounded"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {notices.length === 0 ? (
                <div className="tdx-callout tdx-callout-quiet mt-4">
                    Nothing yet. Submission decisions, badge unlocks and recruits
                    show up here.
                </div>
            ) : (
                <ul className="flex flex-col gap-2.5 mt-4">
                    {notices.map((n) => {
                        const fresh = isFresh(n);
                        return (
                            <li key={n.id}>
                                <Link
                                    href={n.href}
                                    className={`tdx-focus-ring tdx-panel flex gap-3 p-3.5 hover:border-[var(--accent-primary)] transition-colors ${
                                        fresh && n.kind !== "rejected"
                                            ? "border-l-[3px] border-l-[var(--accent-primary)]"
                                            : ""
                                    }`}
                                >
                                    <Icon kind={n.kind} fresh={fresh} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium">{n.title}</p>
                                        <p className="text-[11.5px] text-[var(--text-secondary)] mt-1 leading-[1.45]">
                                            {n.body}
                                        </p>
                                    </div>
                                    <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                                        {relativeTime(n.at)}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            <p className="tdx-callout tdx-callout-quiet mt-4">
                Only submission decisions, badge unlocks and recruits notify.
                Nothing about other people&apos;s ratings, ever.
            </p>
        </div>
    );
}
