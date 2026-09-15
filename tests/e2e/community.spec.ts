import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
const local = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
    }),
);
if (!local.API_URL.startsWith("http://127.0.0.1:"))
    throw new Error("Browser tests require local Supabase.");
const service = createClient(local.API_URL, local.SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});
const suffix = Date.now();
const password = "BrowserTestPassword123";
const title = `Browser Anime Film ${suffix}`;
const users: string[] = [];
async function login(page: Page, email: string) {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("/");
}
test("member submits, admin approves, member watches and rates a movie", async ({
    page,
    browser,
}) => {
    const db = new pg.Client({ connectionString: local.DB_URL });
    await db.connect();
    let titleId: string | undefined;
    const adminContext = await browser.newContext();
    try {
        for (const kind of ["member", "admin"]) {
            const { data, error } = await service.auth.admin.createUser({
                email: `${kind}-${suffix}@example.com`,
                password,
                email_confirm: true,
            });
            if (error) throw error;
            users.push(data.user.id);
        }
        await db.query("insert into public.catalog_admins values($1)", [
            users[1],
        ]);
        await login(page, `member-${suffix}@example.com`);
        await page.goto("/community/new");
        await page.getByLabel("Title", { exact: true }).fill(title);
        await page.getByRole("radio", { name: "Anime", exact: true }).check();
        await page.getByRole("radio", { name: "Movie", exact: true }).check();
        await page.getByLabel("Release year").fill("2026");
        await page.getByLabel(/Runtime/).fill("90");
        await page
            .getByLabel(/HTTPS source links/)
            .fill("https://example.com/official");
        await page
            .getByRole("button", { name: "Check for existing titles" })
            .click();
        await expect(
            page.getByText("Checked for existing titles — no close match."),
        ).toBeVisible();
        await page
            .getByRole("button", { name: "Submit title", exact: true })
            .click();
        await expect(page).toHaveURL("/community");
        await expect(page.getByText(/pending/i)).toBeVisible();
        const admin = await adminContext.newPage();
        await login(admin, `admin-${suffix}@example.com`);
        await admin.goto("/admin");
        await expect(admin.getByText(title, { exact: true })).toBeVisible();
        await admin
            .getByRole("button", { name: "Approve and publish" })
            .click();
        await expect(admin.getByText("Nothing waiting here.")).toBeVisible();
        await page.reload();
        await page.getByRole("link", { name: title, exact: true }).click();
        await expect(page).toHaveURL(/\/series\/[0-9a-f-]{36}$/);
        titleId = page.url().split("/").at(-1);
        await expect(
            page.getByRole("heading", { name: title, exact: true }),
        ).toBeVisible();
        await page
            .getByRole("button", { name: "Watched", exact: true })
            .click();
        await expect(
            page.getByRole("button", { name: "Watched", exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
        await page
            .getByLabel("Private note")
            .fill("A private ending recap.");
        await page
            .getByRole("button", { name: "Save note", exact: true })
            .click();
        await expect(page.getByText("Saved.")).toBeVisible();
        await page.getByRole("radio", { name: "9 out of 10" }).click();
        await expect(
            page.getByText("Community average 9.0 from 1 rating"),
        ).toBeVisible();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/series?filter=movies");
        await expect(
            page.getByRole("heading", { name: title, exact: true }),
        ).toBeVisible();
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        ).toBe(true);
        await page.screenshot({
            path: "test-results/library-mobile.png",
            fullPage: true,
        });
        await page.goto("/rankings?filter=movies");
        await expect(
            page.getByText("No titles qualify yet", { exact: false }),
        ).toBeVisible();
        const guest = await browser.newPage();
        await guest.goto(`/series/${titleId}`);
        await expect(guest.getByText("9.0/10 · 1 rating")).toBeVisible();
        await expect(guest.getByText("A private ending recap.")).toHaveCount(0);
        await guest.close();
    } finally {
        await adminContext.close();
        const { rows } = await db.query(
            "select id from public.series where title=$1",
            [title],
        );
        const ids = rows.map((r) => r.id);
        for (const table of [
            "catalog_reports",
            "catalog_history",
            "catalog_submissions",
        ])
            await db.query(
                `delete from public.${table} where series_id=any($1::uuid[])`,
                [ids],
            );
        await db.query("delete from public.series where id=any($1::uuid[])", [
            ids,
        ]);
        await db.query(
            "delete from public.catalog_submissions where author_id=any($1::uuid[])",
            [users],
        );
        for (const id of users) await service.auth.admin.deleteUser(id);
        await db.end();
    }
});
