---
name: bim-d1-query
description: >-
  Reduces Cloudflare D1 rows read and written for BIM Project Management. Use when
  optimizing SQL, dashboard, timesheets, finance labor allocation, executive
  project lists, strftime filters, N+1 loops, SELECT *, or D1 billing/insights.
---

# D1 query cost — BIM PM

D1 bills **rows scanned** and **rows written**, not statement count. `strftime('%Y', work_date)` prevents `idx_timesheets_work_date` → full SCAN every call.

Helpers: `applyWorkDateFilter`, `monthDateRange`, `yearDateRange` in [src/finance.ts](../../../src/finance.ts).

## Do this

1. Filter dates with `col >= ? AND col < ?` (half-open), then aggregate.
2. Replace month loops (`computeRealtimeLaborByProject`, `computeProjectLaborFromTimesheets`) with **1–2** GROUP BY queries over the whole range.
3. Replace correlated `(SELECT COUNT(*) FROM tasks WHERE project_id = p.id)` with one `GROUP BY project_id` derived table JOIN (`GET /api/projects`, `GET /api/executive/projects`).
4. Narrow SELECT: no `ld.*` / attachment `data` / user `avatar` / `password_hash` on list endpoints.
5. Batch assignee names: one `users WHERE id IN (...)`, not per weekly-plan row.
6. Writes: `db.batch()` for leave-day UPSERTs and legal init INSERTs. Do not migrate legal schema on **GET** overview.
7. Measure first: D1 Insights / `EXPLAIN QUERY PLAN` / `meta.rows_read`. Add indexes only for proven SCAN. Then `PRAGMA optimize` once.

## Do not

- Index every FK “just in case” (extra rows written on INSERT).
- Keep `strftime` on `work_date` / `cost_date` / `revenue_date` on hot paths.
- Treat query count as the cost metric.

## Hot files

- Labor N+1: `computeRealtimeLaborByProject` in `src/index.tsx`; `computeProjectLaborFromTimesheets` in `src/finance.ts`
- Dashboard: `GET /api/dashboard/stats`
- Lists: `GET /api/projects`, `GET /api/executive/projects`, `GET /api/timesheets`

Existing indexes: `0022` (timesheet user+date, project), `0043` (costs/revenues/categories/notifications). Composite `(project_id, work_date)` only if EXPLAIN still SCAN after date-range rewrite.
