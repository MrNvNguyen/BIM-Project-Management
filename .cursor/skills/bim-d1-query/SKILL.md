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
4. **Cấm correlated subquery trong endpoint trả danh sách** — dùng pre-agg JOIN (`GET /api/tasks` subtasks/task_history; `GET /api/projects/:id/categories` task counts). Theo dõi D1 Insights: list endpoint **rows read / rows returned > 100:1** = nợ kỹ thuật.
5. Narrow SELECT: no `ld.*` / attachment `data` / user `avatar` / `password_hash` on list endpoints.
6. Batch assignee names: one `users WHERE id IN (...)`, not per weekly-plan row.
7. Writes: `db.batch()` for leave-day UPSERTs and legal init INSERTs. Do not migrate legal schema on **GET** overview.
8. Measure first: D1 Insights / `EXPLAIN QUERY PLAN` / `meta.rows_read`. Add indexes only for proven SCAN (`idx_tasks_category` for category aggregates). Then `PRAGMA optimize` once.

## Do not

- Index every FK “just in case” (extra rows written on INSERT).
- Keep `strftime` on `work_date` / `cost_date` / `revenue_date` on hot paths.
- Treat query count as the cost metric.
- Use correlated scalar subquery in list/detail endpoints (cost scales with result rows × table scans — measured 344:1 on `GET /api/tasks`, 1.21k:1 on categories, Aug 2026).

## Hot files

- Labor N+1: `computeRealtimeLaborByProject` in `src/index.tsx`; `computeProjectLaborFromTimesheets` in `src/finance.ts`
- Dashboard: `GET /api/dashboard/stats`
- Lists: `GET /api/projects`, `GET /api/executive/projects`, `GET /api/timesheets`, `GET /api/tasks`, `GET /api/projects/:id/categories`

Existing indexes: `0022` (timesheet user+date, project), `0043` (costs/revenues/categories/notifications). Composite `(project_id, work_date)` only if EXPLAIN still SCAN after date-range rewrite.
