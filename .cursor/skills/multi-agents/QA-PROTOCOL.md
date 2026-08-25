# QA Protocol — BIM PM

Read with `SKILL.md` when a wave has QA work.

## 1. Tiers

| Tier | Scope | Required | Batching |
|------|-------|----------|----------|
| Q0 | docs/schema/contract | migration order, types, dictionary consistency | many stages → one QA |
| Q1 | code/API | `npm test` + 1–3 API samples (auth + one domain) | 3–5 stages → one QA |
| Q2 | product spot | Layer B: browser or curl on **changed** screen/API | solo or same-config wave |
| Q3 | product exit | signed DoD: money screens agree, RBAC, no blob in lists | solo once at exit |

```yaml
qa_tier: Q0 | Q1 | Q2 | Q3
qa_batch: solo | wave:<id>
q2_class: ROUTING_SMOKE | PRODUCT_SPOT | MEASURE_FULL | n/a
```

Q3 is never grouped with another stage. QA verifies the shipped git SHA.

## 2. Layer A vs Layer B

| Layer | Purpose | Failure |
|-------|---------|---------|
| A | vitest, API contract, SQL migration apply local | `INFRA-REGRESSION` |
| B | user-visible app: `public/static/app.js` / executive dashboard against running Worker+D1 | `PRODUCT-UX-FAIL` |

Layer A never overrides Layer B. Finance claims need Layer B (or authenticated API returning the three money fields) — not only `computeBookedRevenue` unit tests.

### Q2 class

| Class | Use | Layer B budget |
|-------|-----|----------------|
| `ROUTING_SMOKE` | navigate changed menu/page | one flow |
| `PRODUCT_SPOT` | auth, payment, leave approve, timesheet unique | one fixture project + decisive response/screenshot |
| `MEASURE_FULL` | KPI/DoD / D1 rows_read gate | dashboard + finance + timesheet for same project |

## 3. Product runtime

```text
npm test
npm run db:migrate:local   # when schema changed
npm run dev / wrangler pages dev   # Worker + D1
```

- Prefer browser tools on the running app for UI claims (user rule).
- If no browser: curl + token against local port; say what was not verified.
- Redact `Authorization` tokens in evidence.
- Do not treat Cursor browser MCP as a substitute when the claim is **Cloudflare production**.

## 4. Fingerprint

```yaml
RUN_ENVIRONMENT_FINGERPRINT:
  git_SHA:
  wrangler_or_vite:
  d1_binding: bim-management-production | local
  r2_bound: true | false
  url:
  timestamp:
```

Unavailable fields = explicit `null` + reason.

## 5. Product evidence minimum

| Claim type | Evidence |
|------------|----------|
| Money | same `booked_revenue` / `cash_collected` / `acceptance_amount` on ≥2 screens or APIs |
| RBAC | member 403 on admin/finance route; member of project A cannot read project B |
| Timesheet/leave | two projects same day persist; leave does not overwrite work row |
| D1 cost | `meta.rows_read` or Insights before/after on named endpoint |
| UI | screenshot or exercised flow, not a single static render |

## 6. Crash / auth hard-fail

```yaml
qa_tag: PRODUCT-RUNTIME-FAIL
verdict: FAIL
```

Triggers: Worker 500 on the claimed path, login dead-end, 403 on a role that should pass.

## 7. Attempt class

```yaml
run_class: INVALID_ENVIRONMENT_RUN | PRODUCT_FAILURE_RUN | PRODUCT_PASS_RUN
attempt_outcome: PASS | FALSIFIED | NOT_MEASURED
```

Missing local D1/R2 that blocks the falsifier → `NOT_MEASURED`. Valid wrong numbers still `FALSIFIED`.
