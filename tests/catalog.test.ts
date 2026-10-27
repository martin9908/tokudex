import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JsonLd from "../app/components/JsonLd";
import test from "node:test";
import assert from "node:assert/strict";
import {
    catalogParams,
    catalogMatches,
    normalizeTitle,
    isTokuSeries,
    validateCatalogPayload,
    type CatalogPayload,
} from "../lib/catalog";
const payload: CatalogPayload = {
    title: "Season One",
    category: "anime",
    format: "series",
    franchise: "Example",
    release_year: 2026,
    total_episodes: null,
    runtime_minutes: null,
    synopsis: null,
    episodes: [],
};
test("filters preserve movie/category overlap and clamp pagination", () => {
    assert.ok(catalogMatches({ category: "anime", format: "movie" }, "anime"));
    assert.ok(catalogMatches({ category: "anime", format: "movie" }, "movies"));
    assert.deepEqual(
        catalogParams({ filter: "invalid", page: "-2", q: "  abc  " }),
        { filter: "all", query: "abc", page: 1 },
    );
    assert.equal(catalogParams({ page: "9999999999" }).page, 100000);
    assert.equal(normalizeTitle("  My   SHOW  "), "my show");
});
test("only tokusatsu series earn existing achievements", () => {
    assert.ok(isTokuSeries({ category: "tokusatsu", format: "series" }));
    assert.ok(!isTokuSeries({ category: "anime", format: "series" }));
    assert.ok(!isTokuSeries({ category: "tokusatsu", format: "movie" }));
});
test("sourced seasons allow unknown counts and reject invalid movie/episode data", () => {
    assert.equal(
        validateCatalogPayload(payload, ["https://example.com/show"]),
        null,
    );
    assert.ok(validateCatalogPayload(payload, ["http://example.com"]));
    assert.ok(
        validateCatalogPayload({ ...payload, category: "other" }, [
            "https://example.com",
        ]),
    );
    assert.ok(
        validateCatalogPayload(
            {
                ...payload,
                format: "movie",
                episodes: [{ episode_number: 1, title: "No" }],
            },
            ["https://example.com"],
        ),
    );
    assert.ok(
        validateCatalogPayload(
            {
                ...payload,
                episodes: [
                    { episode_number: 1, title: "A" },
                    { episode_number: 1, title: "B" },
                ],
            },
            ["https://example.com"],
        ),
    );
});

test("repeated query parameters use the first value", () => {
    assert.deepEqual(
        catalogParams({
            q: [" movie ", "other"],
            filter: ["movies", "anime"],
            page: ["2", "3"],
        }),
        { query: "movie", filter: "movies", page: 2 },
    );
});

test("community text cannot close the JSON-LD script element", () => {
    const malicious = '</script><script>alert("xss")</script>';
    const html = renderToStaticMarkup(
        createElement(JsonLd, { data: { name: malicious } }),
    );
    assert.equal((html.match(/<script/g) ?? []).length, 1);
    assert.equal((html.match(/<\/script>/g) ?? []).length, 1);
    const body = html.slice(
        html.indexOf(">") + 1,
        html.lastIndexOf("</script>"),
    );
    assert.equal(JSON.parse(body).name, malicious);
});
