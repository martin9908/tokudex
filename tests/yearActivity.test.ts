import test from "node:test";
import assert from "node:assert/strict";
import { summarizeYear, rowEpisodes, type ActivityRow } from "../lib/yearActivity";

const row = (
    at: string,
    episodes: number | null,
    title = "King-Ohger",
    kind = "logged",
): ActivityRow => ({ kind, episodes, created_at: at, series: { title } });

const now = new Date(2026, 8, 20); // September 2026

test("old rows without an episode count still count a log as one", () => {
    assert.equal(rowEpisodes({ kind: "logged", episodes: null }), 1);
    assert.equal(rowEpisodes({ kind: "shelved", episodes: null }), 0);
    assert.equal(rowEpisodes({ kind: "finished", episodes: 4 }), 4);
});

test("months before tracking started and after today are not tracked", () => {
    const s = summarizeYear([row(new Date(2026, 5, 3).toISOString(), 2)], now);
    assert.deepEqual(
        s.months.map((m) => m.tracked),
        [false, false, false, false, false, true, true, true, true, false, false, false],
    );
    assert.ok(s.months[8].current);
    assert.equal(s.total, 2);
});

test("busiest, quiet and top-share notes", () => {
    const s = summarizeYear(
        [
            row(new Date(2026, 3, 2).toISOString(), 30, "Donbrothers"),
            row(new Date(2026, 3, 9).toISOString(), 18),
            row(new Date(2026, 4, 1).toISOString(), 10),
            row(new Date(2026, 5, 1).toISOString(), 2),
            row(new Date(2026, 8, 1).toISOString(), 17),
            row(new Date(2025, 3, 1).toISOString(), 99), // other year: ignored
        ],
        now,
    );
    assert.equal(s.total, 77);
    assert.deepEqual(s.busiest, { month: 3, episodes: 48, mostly: "Donbrothers" });
    // July and August were tracked but empty; the earliest quiet month wins.
    assert.deepEqual(s.quiet, { month: 6 });
    assert.deepEqual(s.top, { title: "King-Ohger", share: 61 });
});

test("an empty year has no notes", () => {
    const s = summarizeYear([], now);
    assert.equal(s.total, 0);
    assert.equal(s.busiest, null);
    assert.equal(s.quiet, null);
    assert.equal(s.top, null);
});
