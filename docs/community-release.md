# Community catalog release

## Architecture and interfaces

The canonical catalog remains `series`, and existing `/series/:id` links keep working. Category (`tokusatsu`, `anime`, `other`) is independent of format (`series`, `movie`); `other` is movie-only. A movie has a progress count of zero or one, with a private `movie_note` on progress and no episode rows. Anime seasons are separate entries. Existing awards count only tokusatsu series; existing earned timestamps and share snapshots remain intact.

`GET /api/series?q=&filter=all|tokusatsu|anime|movies&page=1` now returns a paginated `series` array (24 rows), the caller's page-scoped `progress`, `total` and `page`. Public callers receive an empty progress map. The library and `/rankings` use the same query parameters. Existing title-detail and mutation URLs are retained.

Database boundaries:

- `save_tracking`: authenticated atomic progress + optional episode/movie note; add-only preserves existing progress. Every write uses the caller's authenticated user ID. Database triggers also validate direct progress/note writes.
- `submit_catalog`: validates metadata and sources, counts daily attempts, creates pending submissions or immediately publishes for active trusted accounts. Validation errors return an error object so the attempt counter commits.
- `review_catalog` and `publish_catalog_submission`: row locks serialize approvals; a publication lock prevents concurrent exact duplicates. Corrections require the captured revision. Existing category/format cannot change through corrections.
- `moderate_catalog`: admin-only visibility, approved poster assignment and revision restore. Restoring keeps private progress and sufficient episode totals; visibility is handled separately.
- `catalog_scores` / `catalog_page`: expose eligible rating aggregates and public catalog fields only. Scores use the selected category's vote-weighted prior; search does not change that prior. Five votes qualify; ten prior votes smooth ordering. Ties use vote count, title, ID.

Private ratings survive progress resets but stop contributing until the member qualifies again. Deleting an account removes its ratings through cascading foreign keys. Contributions/history retain public catalog content with a null author/actor for deleted accounts. Paid trust never changes ranking weight.

## Database baseline and deployment

A read-only `supabase db dump --linked --schema public` succeeded on 2026-09-14. The new baseline matches the original four tables' column types, defaults, uniqueness and cascading foreign keys. It creates missing tables only, preserving existing installations. The hosted automatic-RLS event trigger is not copied; migrations explicitly enable RLS.

The historical seed references production IDs and is not suitable for a fresh local database. Local automatic seeding is disabled; tests create isolated fixtures. Existing seed/import scripts remain available for their documented catalog-maintenance purpose.

1. Back up the target database and verify its migration history. Apply the baseline plus additive migrations in **staging first** using `supabase db push --include-all --dry-run` and then `supabase db push --include-all` after reviewing the target. The older baseline may need `--include-all`; do not mark unapplied migrations as applied.
2. Run the permission, workflow and preservation checks against local/staging environments. Verify the original catalog, progress, notes, earned dates and share URLs.
3. Bootstrap the initial administrator using a privileged SQL connection with the verified user's UUID:

   ```sql
   insert into public.catalog_admins(user_id)
   values ('<verified-auth-user-uuid>') on conflict do nothing;
   ```

4. Deploy the web application **after** its database migrations. It requires the new columns/functions; do not deploy it against the old schema. No new production environment variables are needed.
5. Check library filtering, movie notes, contributions, review, rating eligibility and public rankings. Monitor `catalog_publication_failed` and `rating_failed` log events; their payloads contain codes, not notes/payment evidence. Query the pending queue and unresolved reports from the admin page.

Trust is managed at `/admin`. Supporter trust requires a manually verified paid-through expiry. Expired/revoked trust affects new publications only. No payment evidence, billing integration or Patreon API access is stored. Contributors can find their member ID in `/community`.

For rollback, revert the application and retain additive data; do not drop tables holding contributions/ratings. Catalog mistakes can be restored as a new revision from `/admin?id=<title-id>`. Hidden titles retain tracking history but disappear from public browsing/rankings.

## Local checks

```sh
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor
npm test
npm run test:db
npx playwright install chromium
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run build
```

Database tests refuse non-local connections. Workflow tests run inside a rolled-back transaction; migration tests create/drop a dedicated temporary local database. Browser tests create disposable local accounts/catalog data and clean them up. The browser server uses port 3100 and `.next-test`, with local Supabase variables supplied by the test runner, without overwriting `.env.local`.
