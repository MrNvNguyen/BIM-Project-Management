---
name: bim-d1-migrations
description: >-
  Adds additive Cloudflare D1 SQL migrations for BIM Project Management. Use when
  creating or changing migrations/*.sql, schema, indexes, UNIQUE constraints, or
  when tempted to create tables in POST /api/system/init.
---

# D1 migrations — BIM PM

## Rules

- New files only: `migrations/NNNN_snake_name.sql` after the highest existing number. Never edit `0001`–already-applied files on production.
- Additive DDL: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN`.
- SQLite/`ALTER ADD COLUMN` **fails** if the column exists. Do not add a column that production already has via init (example: `0028` skipped `timesheets.category_id`).
- Production schema is **only** migrations. `POST /api/system/init` is 403 unless `ALLOW_SYSTEM_INIT=1` (local). Never DELETE business rows from init.
- Destructive UNIQUE/dedup: run on a **D1 copy** first; list affected ids; PO before production.

## Apply

```bash
npm run db:migrate:local
# wrangler d1 migrations apply bim-management-production --local
```

Remote: `wrangler d1 migrations apply bim-management-production` (user must confirm).

## Patterns already in repo

| Concern | File |
|---------|------|
| Finance bootstrap tables + query indexes | `migrations/0043_bootstrap_tables_and_indexes.sql` |
| Leave unique `(user_id, work_date) WHERE project_id IS NULL` | `migrations/0044_timesheet_leave_unique.sql` |
| Chat/legal R2 metadata | `0045`, `0046` |

Work timesheets: `UNIQUE(user_id, project_id, work_date)` (0022). SQLite does not coalesce `project_id IS NULL` into that unique — leave uses the partial index in 0044.

## Indexes

Add only after `EXPLAIN QUERY PLAN` shows `SCAN` on a hot path. D1 bills extra **rows written** for index maintenance. Prefer `(project_id, work_date)` over wrapping `work_date` in `strftime`. After new indexes: `PRAGMA optimize` once, not per request.

## Do not

- HTTP routes that `CREATE TABLE` for production
- `DROP TABLE` / rewrite tables except documented one-shot rebuilds already in old migrations
- Commit D1 dump binaries
