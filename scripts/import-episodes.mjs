#!/usr/bin/env node
/**
 * Import episodes (incl. recap synopses) for a series from a CSV.
 *
 * CSV columns (header row required, order-independent):
 *   episode_number   integer, required
 *   title            text, required
 *   synopsis         text, optional — this is the "what happened" recap
 *   air_date         YYYY-MM-DD, optional
 *
 * Usage:
 *   node scripts/import-episodes.mjs --series "Kamen Rider Kuuga" --file path/to.csv
 *   node scripts/import-episodes.mjs --series-id <uuid> --file path/to.csv --out out.sql
 *   node scripts/import-episodes.mjs --series "Kamen Rider Kuuga" --file path/to.csv --push
 *
 * Default: prints idempotent upsert SQL to stdout (review, then run in the
 * Supabase SQL editor). --out writes it to a file. --push applies it directly
 * via the service-role key (reads .env.local automatically).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parse } from "csv-parse/sync";

// ---- args -----------------------------------------------------------------
function getArg(name) {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 ? process.argv[i + 1] : undefined;
}
const seriesTitle = getArg("series");
const seriesId = getArg("series-id");
const file = getArg("file");
const out = getArg("out");
const push = process.argv.includes("--push");

if (!file || (!seriesTitle && !seriesId)) {
    console.error(
        "Usage: node scripts/import-episodes.mjs --series \"<title>\" | --series-id <uuid> --file <csv> [--out <sql>] [--push]"
    );
    process.exit(1);
}
if (!existsSync(file)) {
    console.error(`CSV not found: ${file}`);
    process.exit(1);
}

// ---- parse CSV ------------------------------------------------------------
const rows = parse(readFileSync(file), {
    columns: (header) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
});

const episodes = [];
const problems = [];
rows.forEach((row, idx) => {
    const line = idx + 2; // +1 header, +1 to 1-base
    const num = Number.parseInt(row.episode_number, 10);
    const title = (row.title ?? "").trim();
    const synopsis = (row.synopsis ?? "").trim();
    const airDate = (row.air_date ?? "").trim();

    if (!Number.isInteger(num) || num < 1) {
        problems.push(`Line ${line}: invalid episode_number "${row.episode_number}"`);
        return;
    }
    if (!title) {
        problems.push(`Line ${line}: missing title`);
        return;
    }
    if (airDate && !/^\d{4}-\d{2}-\d{2}$/.test(airDate)) {
        problems.push(`Line ${line}: air_date must be YYYY-MM-DD ("${airDate}")`);
        return;
    }
    if (!synopsis) {
        console.warn(`⚠ Line ${line} (episode ${num}): empty synopsis/recap`);
    }
    episodes.push({ num, title, synopsis, airDate });
});

if (problems.length) {
    console.error("Aborting — fix these rows:\n" + problems.map((p) => "  • " + p).join("\n"));
    process.exit(1);
}
if (!episodes.length) {
    console.error("No valid episode rows found.");
    process.exit(1);
}

// ---- SQL generation -------------------------------------------------------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`; // escape single quotes
const seriesRef = seriesId
    ? `'${seriesId}'::uuid`
    : `(select id from public.series where title = ${q(seriesTitle)})`;

function rowSql({ num, title, synopsis, airDate }) {
    const syn = synopsis ? q(synopsis) : "null";
    const air = airDate ? `${q(airDate)}::date` : "null::date";
    return (
        `insert into public.episodes (series_id, episode_number, title, synopsis, air_date)\n` +
        `select ${seriesRef}, ${num}, ${q(title)}, ${syn}, ${air}\n` +
        `where ${seriesRef} is not null\n` +
        `on conflict (series_id, episode_number)\n` +
        `do update set title = excluded.title, synopsis = excluded.synopsis, air_date = excluded.air_date;`
    );
}

const header =
    `-- Episodes for ${seriesId ? `series ${seriesId}` : seriesTitle}\n` +
    `-- Generated from ${file} — ${episodes.length} episode(s). Idempotent (upsert).\n`;
const sql = header + "\nbegin;\n\n" + episodes.map(rowSql).join("\n\n") + "\n\ncommit;\n";

// ---- output ---------------------------------------------------------------
if (push) {
    await pushDirect(episodes);
} else if (out) {
    writeFileSync(out, sql);
    console.log(`Wrote ${episodes.length} episode(s) to ${out}`);
    console.log("Review it, then run it in the Supabase SQL editor (or via psql).");
} else {
    process.stdout.write(sql);
}

// ---- --push: apply via service role --------------------------------------
async function pushDirect(eps) {
    loadEnvLocal();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.error(
            "--push needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env.local or the environment)."
        );
        process.exit(1);
    }
    const { createClient } = await import("@supabase/supabase-js");
    const supa = createClient(url, key, { auth: { persistSession: false } });

    let resolvedSeriesId = seriesId;
    if (!resolvedSeriesId) {
        const { data, error } = await supa
            .from("series")
            .select("id")
            .eq("title", seriesTitle)
            .single();
        if (error || !data) {
            console.error(`Series not found by title: ${seriesTitle}`);
            process.exit(1);
        }
        resolvedSeriesId = data.id;
    }

    const payload = eps.map((e) => ({
        series_id: resolvedSeriesId,
        episode_number: e.num,
        title: e.title,
        synopsis: e.synopsis || null,
        air_date: e.airDate || null,
    }));

    const { error } = await supa
        .from("episodes")
        .upsert(payload, { onConflict: "series_id,episode_number" });
    if (error) {
        console.error("Upsert failed:", error.message);
        process.exit(1);
    }
    console.log(`✓ Upserted ${payload.length} episode(s) for series ${resolvedSeriesId}.`);
}

// Minimal .env.local loader (KEY=VALUE lines) so --push works locally.
function loadEnvLocal() {
    if (!existsSync(".env.local")) return;
    for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq === -1) continue;
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!(k in process.env)) process.env[k] = v;
    }
}
