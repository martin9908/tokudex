import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
const connectionString =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
if (!["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname))
    throw new Error("Database tests require local Supabase.");
const db = new pg.Client({ connectionString });
const ids = Array.from({ length: 9 }, () => randomUUID());
const [admin, member, trusted, supporter, expired] = ids;
const source = ["https://example.com/official"];
const base = {
    title: "Integration Title",
    category: "anime",
    format: "series",
    release_year: 2026,
    total_episodes: 12,
    episodes: [{ episode_number: 1, title: "Beginning" }],
};
async function actor(id: string | null) {
    await db.query("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
        id ?? "",
    ]);
    await db.query(`set local role ${id ? "authenticated" : "anon"}`);
}
async function root() {
    await db.query("reset role");
}
async function rpc(name: string, values: unknown[]) {
    const { rows } = await db.query(
        `select to_jsonb(public.${name}(${values.map((_, i) => "$" + (i + 1)).join(",")})) as result`,
        values,
    );
    return rows[0].result;
}
async function rejects(fn: () => Promise<unknown>, pattern?: RegExp) {
    await db.query("savepoint expected_error");
    try {
        await (pattern ? assert.rejects(fn, pattern) : assert.rejects(fn));
    } finally {
        await db.query("rollback to savepoint expected_error");
    }
}
async function submit(
    payload: object = base,
    id: string | null = null,
    rev: number | null = null,
) {
    return rpc("submit_catalog", [JSON.stringify(payload), source, id, rev]);
}
test("database workflows, RLS and rankings", async (t) => {
    await db.connect();
    await db.query("begin");
    try {
        for (const id of ids)
            await db.query("insert into auth.users(id) values($1)", [id]);
        await db.query("insert into public.catalog_admins values($1)", [admin]);
        await db.query(
            "insert into public.catalog_trust(user_id,kind,expires_at,granted_by) values($1,'contributor',null,$4),($2,'supporter',now()+interval '1 day',$4),($3,'supporter',now()-interval '1 day',$4)",
            [trusted, supporter, expired, admin],
        );
        let title: string;
        let submission: string;
        await t.test(
            "regular members await review; direct publication/role writes are blocked",
            async () => {
                await actor(member);
                const result = await submit();
                assert.equal(result.published, false);
                submission = result.id;
                assert.equal(
                    (
                        await db.query(
                            "select * from public.series where title=$1",
                            [base.title],
                        )
                    ).rowCount,
                    0,
                );
                await rejects(
                    () => rpc("publish_catalog_submission", [submission]),
                    /Unauthorized/,
                );
                await rejects(
                    () =>
                        db.query(
                            "insert into public.catalog_admins values($1)",
                            [member],
                        ),
                    /row-level security/,
                );
                await rejects(
                    () =>
                        db.query(
                            "insert into public.series(title) values('Bypass')",
                        ),
                    /row-level security/,
                );
                await actor(admin);
                title = await rpc("review_catalog", [
                    submission,
                    true,
                    null,
                    null,
                    null,
                ]);
                assert.ok(title);
                assert.equal(
                    await rpc("publish_catalog_submission", [submission]),
                    title,
                );
            },
        );
        await t.test("starting a series and atomic check-ins", async () => {
            await actor(member);
            const p = await rpc("save_tracking", [
                title,
                1,
                "watching",
                "A private note",
                1,
                false,
            ]);
            assert.equal(p.current_episode, 1);
            await rejects(
                () =>
                    rpc("save_tracking", [
                        title,
                        2,
                        "watching",
                        "Invalid later note",
                        99,
                        false,
                    ]),
                /Invalid episode note/,
            );
            assert.equal(
                (
                    await db.query(
                        "select current_episode from public.user_series_progress where series_id=$1",
                        [title],
                    )
                ).rows[0].current_episode,
                1,
            );
            const existing = await rpc("save_tracking", [
                title,
                0,
                "plan_to_watch",
                null,
                null,
                true,
            ]);
            assert.equal(existing.current_episode, 1);
        });
        await t.test(
            "trusted publication, duplicate checks, expired trust and stale correction",
            async () => {
                await actor(trusted);
                const result = await submit({
                    ...base,
                    title: "Trusted title",
                });
                assert.ok(result.published);
                const duplicate = await submit({
                    ...base,
                    title: "  TRUSTED   title ",
                });
                assert.match(duplicate.error, /identical/);
                const correction = await submit(
                    {
                        ...base,
                        title: "Integration Title",
                        synopsis: "Corrected",
                    },
                    title,
                    1,
                );
                assert.ok(correction.published);
                const stale = await submit(
                    { ...base, synopsis: "Stale" },
                    title,
                    1,
                );
                assert.match(stale.error, /changed/);
                await actor(supporter);
                assert.ok(
                    (await submit({ ...base, title: "Supporter title" }))
                        .published,
                );
                await actor(expired);
                assert.equal(
                    (await submit({ ...base, title: "Expired title" }))
                        .published,
                    false,
                );
                await actor(member);
                const pending = await submit({
                    ...base,
                    title: "Rejected title",
                });
                await actor(admin);
                await rpc("review_catalog", [
                    pending.id,
                    false,
                    "Please provide a better source",
                    null,
                    null,
                ]);
                await actor(member);
                assert.equal(
                    (await submit({ ...base, title: "Rejected title" }))
                        .published,
                    false,
                );
            },
        );
        await t.test(
            "movies are 0/1, have private notes, and overlap categories",
            async () => {
                await actor(trusted);
                const result = await submit({
                    ...base,
                    title: "Anime Film",
                    format: "movie",
                    runtime_minutes: 90,
                    episodes: [],
                });
                const movie = result.series_id;
                await actor(member);
                await rejects(
                    () =>
                        db.query(
                            "insert into public.title_ratings(user_id,series_id,score) values($1,$2,10)",
                            [member, movie],
                        ),
                    /Start this/,
                );
                const p = await rpc("save_tracking", [
                    movie,
                    1,
                    "completed",
                    "Movie note",
                    null,
                    false,
                ]);
                assert.equal(p.movie_note, "Movie note");
                await rejects(
                    () =>
                        db.query(
                            "update public.user_series_progress set current_episode=2 where series_id=$1",
                            [movie],
                        ),
                    /Movies/,
                );
                await rejects(
                    () =>
                        db.query(
                            "insert into public.episode_notes(user_id,series_id,episode_number,note) values($1,$2,1,'no')",
                            [member, movie],
                        ),
                    /Invalid episode note/,
                );
                assert.equal(
                    (
                        await db.query(
                            "select * from public.episodes where series_id=$1",
                            [movie],
                        )
                    ).rowCount,
                    0,
                );
                await db.query(
                    "insert into public.title_ratings(user_id,series_id,score) values($1,$2,9)",
                    [member, movie],
                );
                await actor(null);
                for (const filter of ["anime", "movies"]) {
                    const page = await rpc("catalog_page", [
                        filter,
                        "Anime Film",
                        1,
                        false,
                    ]);
                    assert.equal(page.items[0].id, movie);
                }
            },
        );
        await t.test(
            "rankings use eligible votes, hide voter data, reset and delete correctly",
            async () => {
                for (const id of ids.slice(1, 7)) {
                    await actor(id);
                    await rpc("save_tracking", [
                        title,
                        1,
                        "watching",
                        null,
                        null,
                        false,
                    ]);
                    await db.query(
                        "insert into public.title_ratings(user_id,series_id,score) values($1,$2,8)",
                        [id, title],
                    );
                }
                await actor(null);
                assert.equal(
                    (await db.query("select * from public.title_ratings"))
                        .rowCount,
                    0,
                );
                const scores = (
                    await db.query(
                        "select * from public.catalog_scores() where series_id=$1",
                        [title],
                    )
                ).rows[0];
                assert.equal(Number(scores.vote_count), 6);
                assert.equal(Number(scores.average_score), 8);
                const page = await rpc("catalog_page", [
                    "anime",
                    "Integration Title",
                    1,
                    true,
                ]);
                assert.equal(page.items.length, 1);
                const prior = (6 * 8 + 9) / 7;
                assert.ok(
                    Math.abs(
                        Number(page.items[0].weighted_score) -
                            (6 * 8 + 10 * prior) / 16,
                    ) < 1e-8,
                );
                await actor(member);
                await rpc("save_tracking", [
                    title,
                    0,
                    "plan_to_watch",
                    null,
                    null,
                    false,
                ]);
                assert.equal(
                    (
                        await db.query(
                            "select * from public.title_ratings where series_id=$1",
                            [title],
                        )
                    ).rowCount,
                    1,
                );
                await rejects(
                    () =>
                        db.query(
                            "update public.title_ratings set score=10 where series_id=$1",
                            [title],
                        ),
                    /Start this/,
                );
                await actor(ids[2]);
                await rpc("save_tracking", [
                    title,
                    0,
                    "plan_to_watch",
                    null,
                    null,
                    false,
                ]);
                await actor(null);
                assert.equal(
                    (
                        await rpc("catalog_page", [
                            "anime",
                            "Integration Title",
                            1,
                            true,
                        ])
                    ).items.length,
                    0,
                );
                await actor(member);
                await db.query(
                    "delete from public.title_ratings where series_id=$1",
                    [title],
                );
                assert.equal(
                    (
                        await db.query(
                            "select * from public.title_ratings where series_id=$1",
                            [title],
                        )
                    ).rowCount,
                    0,
                );
                await root();
                await db.query("delete from auth.users where id=$1", [ids[6]]);
                assert.equal(
                    (
                        await db.query(
                            "select * from public.title_ratings where user_id=$1",
                            [ids[6]],
                        )
                    ).rowCount,
                    0,
                );
            },
        );
        await t.test(
            "history revert, reports and hidden titles preserve private progress",
            async () => {
                await actor(member);
                await db.query(
                    "insert into public.catalog_reports(series_id,author_id,reason) values($1,$2,'Wrong synopsis')",
                    [title, member],
                );
                await actor(admin);
                const history = (
                    await db.query(
                        "select id from public.catalog_history where series_id=$1 and revision=1",
                        [title],
                    )
                ).rows[0];
                await rpc("moderate_catalog", [
                    title,
                    2,
                    null,
                    null,
                    history.id,
                ]);
                assert.equal(
                    (
                        await db.query(
                            "select revision from public.series where id=$1",
                            [title],
                        )
                    ).rows[0].revision,
                    3,
                );
                await rpc("moderate_catalog", [title, 3, true, null, null]);
                await actor(null);
                assert.equal(
                    (
                        await db.query(
                            "select * from public.series where id=$1",
                            [title],
                        )
                    ).rowCount,
                    0,
                );
                assert.equal(
                    (await rpc("catalog_page", ["all", base.title, 1, false]))
                        .items.length,
                    0,
                );
                assert.equal(
                    (
                        await db.query(
                            "select * from public.catalog_scores() where series_id=$1",
                            [title],
                        )
                    ).rowCount,
                    0,
                );
                await actor(member);
                assert.equal(
                    (
                        await db.query(
                            "select * from public.user_series_progress where series_id=$1",
                            [title],
                        )
                    ).rowCount,
                    1,
                );
                await actor(trusted);
                assert.equal(
                    (await db.query("select * from public.catalog_reports"))
                        .rowCount,
                    0,
                );
            },
        );
        await t.test(
            "pagination, independent seasons, and unknown episode counts",
            async () => {
                await root();
                for (let i = 0; i < 25; i++)
                    await db.query(
                        "insert into public.series(title,category,format,release_year) values($1,'anime','series',2026)",
                        [`Pagination fixture ${String(i).padStart(2, "0")}`],
                    );
                await actor(null);
                const first = await rpc("catalog_page", [
                    "anime",
                    "Pagination fixture",
                    1,
                    false,
                ]);
                const second = await rpc("catalog_page", [
                    "anime",
                    "Pagination fixture",
                    2,
                    false,
                ]);
                assert.equal(first.total, 25);
                assert.equal(first.items.length, 24);
                assert.equal(second.items.length, 1);
                assert.ok(
                    !first.items.some(
                        (item: { id: string }) =>
                            item.id === second.items[0].id,
                    ),
                );
                await actor(trusted);
                const season = await submit({
                    ...base,
                    title: "Unknown Season Two",
                    franchise: "Integration",
                    total_episodes: null,
                    episodes: [],
                });
                assert.ok(season.published);
                await actor(member);
                const progress = await rpc("save_tracking", [
                    season.series_id,
                    27,
                    "watching",
                    null,
                    null,
                    false,
                ]);
                assert.equal(progress.current_episode, 27);
                await rejects(
                    () =>
                        db.query("select public.catalog_snapshot($1)", [
                            season.series_id,
                        ]),
                    /permission denied/,
                );
            },
        );
        await t.test(
            "failed submissions count toward the daily limit",
            async () => {
                await actor(ids[8]);
                for (let i = 0; i < 10; i++)
                    assert.ok((await submit({ ...base, title: "" })).error);
                assert.match(
                    (await submit({ ...base, title: "Eleventh attempt" }))
                        .error,
                    /Daily limit/,
                );
            },
        );
        await t.test(
            "profiles, the activity feed and the share_activity switch",
            async () => {
                const fan = ids[7];
                await actor(trusted);
                const feedTitle = (
                    await submit({ ...base, title: "Feed title" })
                ).series_id;
                assert.ok(feedTitle);
                await actor(fan);
                await rejects(
                    () => rpc("set_profile", ["Bad Handle!", null, null]),
                    /Handles are/,
                );
                const profile = await rpc("set_profile", [
                    "Hoshino_" + ids[7].slice(0, 4),
                    "Hoshino",
                    null,
                ]);
                assert.match(profile.handle, /^hoshino_/);
                assert.equal(profile.share_activity, true);
                await actor(member);
                await rejects(
                    () => rpc("set_profile", [profile.handle, null, null]),
                    /taken/,
                );
                await actor(fan);
                await rpc("save_tracking", [feedTitle, 3, "watching", null, null, false]);
                await rpc("save_tracking", [feedTitle, 3, "on_hold", null, null, false]);
                await actor(member);
                const feed = (
                    await db.query(
                        "select kind,episode from public.activity where user_id=$1 order by kind",
                        [fan],
                    )
                ).rows;
                assert.deepEqual(feed, [
                    { kind: "logged", episode: 3 },
                    { kind: "shelved", episode: 3 },
                ]);
                await rejects(
                    () =>
                        db.query(
                            "insert into public.activity(user_id,kind,series_id) values($1,'logged',$2)",
                            [member, feedTitle],
                        ),
                    /row-level security/,
                );
                await actor(fan);
                await rpc("set_profile", [profile.handle, null, false]);
                await rpc("save_tracking", [feedTitle, 5, "watching", null, null, false]);
                await actor(member);
                assert.equal(
                    (
                        await db.query(
                            "select count(*)::int as n from public.activity where user_id=$1",
                            [fan],
                        )
                    ).rows[0].n,
                    2,
                );
                // A member with no profile row never appears in the feed.
                assert.equal(
                    (
                        await db.query(
                            "select count(*)::int as n from public.activity where user_id=$1",
                            [member],
                        )
                    ).rows[0].n,
                    0,
                );
                // Publishing a new title credits its author.
                await actor(fan);
                await rpc("set_profile", [profile.handle, null, true]);
                const added = await submit({ ...base, title: "Credited Title" });
                await actor(admin);
                const created = await rpc("review_catalog", [
                    added.id,
                    true,
                    null,
                    null,
                    null,
                ]);
                await rpc("publish_catalog_submission", [added.id]);
                await actor(null);
                const credits = (
                    await db.query(
                        "select handle from public.catalog_credits($1::uuid[])",
                        [[created]],
                    )
                ).rows;
                assert.equal(credits[0].handle, profile.handle);
                assert.equal(
                    (
                        await db.query(
                            "select kind from public.activity where series_id=$1",
                            [created],
                        )
                    ).rows[0].kind,
                    "added",
                );
                const page = await rpc("catalog_page", [
                    "needs_work",
                    "",
                    1,
                    false,
                ]);
                assert.ok(
                    page.items.some(
                        (i: { id: string; episode_count: number }) =>
                            i.id === created && i.episode_count === 1,
                    ),
                );
            },
        );
    } finally {
        await db.query("rollback");
        await db.end();
    }
});

test("concurrent duplicate approvals publish one title only", async () => {
    const owner = new pg.Client({ connectionString });
    await owner.connect();
    const memberId = randomUUID(),
        adminId = randomUUID();
    const title = "Concurrent " + randomUUID();
    const connections: pg.Client[] = [];
    try {
        await owner.query("insert into auth.users(id) values($1),($2)", [
            memberId,
            adminId,
        ]);
        await owner.query("insert into public.catalog_admins values($1)", [
            adminId,
        ]);
        const subs: string[] = [];
        for (let i = 0; i < 2; i++) {
            const r = await owner.query(
                "insert into public.catalog_submissions(author_id,payload,sources) values($1,$2,$3) returning id",
                [memberId, JSON.stringify({ ...base, title }), source],
            );
            subs.push(r.rows[0].id);
        }
        for (let i = 0; i < 2; i++) {
            const c = new pg.Client({ connectionString });
            await c.connect();
            connections.push(c);
            await c.query("begin");
            await c.query(
                "select set_config('request.jwt.claim.sub',$1,true)",
                [adminId],
            );
            await c.query("set local role authenticated");
        }
        const results = await Promise.allSettled(
            connections.map(async (c, i) => {
                try {
                    const result = await c.query(
                        "select public.review_catalog($1,true)",
                        [subs[i]],
                    );
                    await c.query("commit");
                    return result.rows;
                } catch (error) {
                    await c.query("rollback");
                    throw error;
                }
            }),
        );
        assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
        assert.equal(
            (
                await owner.query(
                    "select * from public.series where title=$1",
                    [title],
                )
            ).rowCount,
            1,
        );
    } finally {
        for (const c of connections) await c.end();
        await owner.query(
            "delete from public.catalog_history where series_id in (select id from public.series where title=$1)",
            [title],
        );
        await owner.query(
            "delete from public.catalog_submissions where author_id=$1",
            [memberId],
        );
        await owner.query("delete from public.series where title=$1", [title]);
        await owner.query("delete from auth.users where id in ($1,$2)", [
            memberId,
            adminId,
        ]);
        await owner.end();
    }
});
