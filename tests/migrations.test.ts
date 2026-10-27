import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
const url = new URL(
    process.env.TEST_DATABASE_URL ??
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
);
if (!["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error("Migration tests require local Postgres.");
test("fresh installation and additive migration preserve existing data", async () => {
    const control = new pg.Client({ connectionString: url.href });
    await control.connect();
    const name = "tokudex_migration_" + Date.now();
    let db: pg.Client | undefined;
    try {
        await control.query(`create database ${name}`);
        url.pathname = "/" + name;
        db = new pg.Client({ connectionString: url.href });
        await db.connect();
        await db.query(
            `create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; alter default privileges in schema public grant all on tables to anon,authenticated;`,
        );
        const migrations = (await readdir("supabase/migrations"))
            .filter((n) => n.endsWith(".sql"))
            .sort();
        for (const file of migrations.filter((n) => n < "20260914"))
            await db.query(
                await readFile("supabase/migrations/" + file, "utf8"),
            );
        const user = randomUUID(),
            series = randomUUID();
        await db.query("insert into auth.users values($1)", [user]);
        await db.query(
            "insert into public.series(id,title,total_episodes,original_run) values($1,'Preserved',50,'2000-2001')",
            [series],
        );
        await db.query(
            "insert into public.user_series_progress(user_id,series_id,current_episode) values($1,$2,12)",
            [user, series],
        );
        await db.query(
            "insert into public.episode_notes(user_id,series_id,episode_number,note) values($1,$2,12,'Private recap')",
            [user, series],
        );
        await db.query(
            "insert into public.user_achievements(user_id,achievement_key,earned_at) values($1,'ach-log-10','2020-01-01')",
            [user],
        );
        await db.query(
            "insert into public.share_cards(user_id,slug,share_key,kind,title) values($1,'old-share','stats','stats','Original')",
            [user],
        );
        const before = (
            await db.query(
                "select row_to_json(p) as p from public.user_series_progress p",
            )
        ).rows[0].p;
        for (const file of migrations.filter((n) => n >= "20260914"))
            await db.query(
                await readFile("supabase/migrations/" + file, "utf8"),
            );
        const after = (
            await db.query(
                "select row_to_json(p) as p from public.user_series_progress p",
            )
        ).rows[0].p;
        delete after.movie_note;
        assert.deepEqual(after, before);
        const catalog = (await db.query("select * from public.series")).rows[0];
        assert.equal(catalog.id, series);
        assert.equal(catalog.category, "tokusatsu");
        assert.equal(catalog.format, "series");
        assert.equal(catalog.release_year, 2000);
        assert.equal(
            (await db.query("select note from public.episode_notes")).rows[0]
                .note,
            "Private recap",
        );
        assert.equal(
            (
                await db.query("select earned_at from public.user_achievements")
            ).rows[0].earned_at.toISOString(),
            "2020-01-01T00:00:00.000Z",
        );
        assert.equal(
            (await db.query("select slug from public.share_cards")).rows[0]
                .slug,
            "old-share",
        );
        assert.equal(
            (await db.query("select * from public.catalog_history")).rowCount,
            1,
        );
    } finally {
        await db?.end();
        await control.query(`drop database if exists ${name} with (force)`);
        await control.end();
    }
});
