import { CheckCircle, CircleDashed, WarningCircle } from "@phosphor-icons/react/ssr";

export type TimelineStep = {
    title: string;
    body: string;
    state: "done" | "pending" | "failed";
};

function when(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function buildTimeline(sub: {
    status: string;
    created_at: string;
    reviewed_at: string | null;
    reason: string | null;
    series_id: string | null;
    base_revision: number | null;
    poster: boolean;
    votes: number;
}): TimelineStep[] {
    const steps: TimelineStep[] = [
        { title: "Submitted", body: `${when(sub.created_at)} · by you`, state: "done" },
    ];
    if (sub.status === "pending") {
        steps.push({
            title: "Duplicate check",
            body: "Waiting for an admin to look it over",
            state: "pending",
        });
        steps.push({ title: "Published", body: "Usually within a day or two", state: "pending" });
    } else if (sub.status === "rejected") {
        steps.push({
            title: "Sent back",
            body: sub.reviewed_at
                ? `${when(sub.reviewed_at)}${sub.reason ? ` · “${sub.reason}”` : ""}`
                : (sub.reason ?? "The reviewer sent it back."),
            state: "failed",
        });
        steps.push({ title: "Published", body: "Submit a revision to try again", state: "pending" });
    } else {
        steps.push({
            title: "Duplicate check cleared",
            body: "Reviewed by an admin",
            state: "done",
        });
        steps.push({
            title: sub.base_revision !== null ? "Correction published" : "Published",
            body: `${sub.reviewed_at ? when(sub.reviewed_at) : "Live"}${sub.poster ? " · poster assigned from storage" : " · poster still to come"}`,
            state: "done",
        });
    }
    if (sub.status === "published" && sub.series_id) {
        const ranked = sub.votes >= 5;
        steps.push({
            title: "Ranked",
            body: ranked
                ? `${sub.votes} eligible votes — in the rankings`
                : `${sub.votes} of 5 eligible votes — appears in rankings at 5`,
            state: ranked ? "done" : "pending",
        });
    }
    return steps;
}

/** The vertical stepper — one submission from submitted to ranked. */
export default function SubmissionTimeline({
    title,
    steps,
}: {
    title: string;
    steps: TimelineStep[];
}) {
    return (
        <section className="rounded-lg border border-[var(--line)] p-5 md:p-6">
            <p className="text-[12.5px] text-[var(--text-secondary)]">
                One submission, end to end
            </p>
            <p className="text-[17px] font-medium mt-[7px]">{title}</p>
            <div className="flex flex-col mt-4">
                {steps.map((s, i) => {
                    const last = i === steps.length - 1;
                    return (
                        <div key={s.title} className="flex gap-[13px]">
                            <div className="flex flex-col items-center flex-none">
                                {s.state === "done" ? (
                                    <CheckCircle
                                        size={17}
                                        weight="fill"
                                        className="text-[var(--accent-primary)]"
                                        aria-hidden
                                    />
                                ) : s.state === "failed" ? (
                                    <WarningCircle
                                        size={17}
                                        className="text-[var(--warning)]"
                                        aria-hidden
                                    />
                                ) : (
                                    <CircleDashed
                                        size={17}
                                        className="text-[var(--text-muted)]"
                                        aria-hidden
                                    />
                                )}
                                {!last && (
                                    <div
                                        className={`w-[1.5px] flex-1 min-h-[26px] ${
                                            s.state === "done"
                                                ? "bg-[var(--accent-primary)]"
                                                : "bg-[var(--line)]"
                                        }`}
                                    />
                                )}
                            </div>
                            <div className={last ? "" : "pb-4"}>
                                <p
                                    className={`text-[13px] font-medium ${
                                        s.state === "pending"
                                            ? "text-[var(--text-secondary)]"
                                            : ""
                                    }`}
                                >
                                    {s.title}
                                </p>
                                <p
                                    className={`text-[11.5px] mt-[3px] ${
                                        s.state === "pending"
                                            ? "text-[var(--text-muted)]"
                                            : "text-[var(--text-secondary)]"
                                    }`}
                                >
                                    {s.body}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
