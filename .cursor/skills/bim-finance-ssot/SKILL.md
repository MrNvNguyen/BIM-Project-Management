---
name: bim-finance-ssot
description: >-
  Enforces one money/progress formula path for BIM Project Management. Use when
  changing payments, revenues, VAT, management fee, project budget, labor cost,
  dashboard KPIs, timesheet leave keys, or any UI that displays đồng/tiến độ.
---

# Số liệu một nguồn — BIM PM

Canonical text: [docs/TU-DIEN-SO-LIEU.md](../../../docs/TU-DIEN-SO-LIEU.md). Code: [src/finance.ts](../../../src/finance.ts).

## Money (UI formats only)

| Metric | Source | Forbidden |
|--------|--------|-----------|
| Nghiệm thu | `payment_requests.amount` | treating `project_revenues.amount` as HĐ |
| Dòng tiền | `payment_requests.paid_amount` | adding cash into booked revenue |
| Doanh thu vào sổ | `project_revenues.amount` via `syncPaymentToRevenue` | recomputing VAT/fee in `public/static/app.js` |
| Ngân sách | `computeProjectBudget(contract_value, management_fee_pct)` | writing `projects.budget` as KPI |

```text
amount_before_vat = amount / (1 + vat%/100)
booked_revenue    = amount_before_vat × (1 − fee%/100)
```

List/detail APIs must return `acceptance_amount`, `amount_before_vat`, `booked_revenue`, `cash_collected` (`enrichPaymentMetrics` / `enrichRevenueRow`).

Labor KPI: timesheet hours × `monthly_labor_costs` (`computeProjectLaborFromTimesheets`). Do not read `project_labor_costs` for reports.

Audit: `GET /api/finance/revenue-audit`.

## Progress / health

- KPI progress = tasks `completed|review` / not `cancelled`.
- `projects.progress` = PM label (`pm_progress`).
- Overdue = `due_date` live, not `tasks.is_overdue` as the KPI number.
- `project_health.health_score` = `pm_score`; analytics `computed_score` — do not mix on one widget.

## Timesheet / leave

- Work: `UNIQUE(user_id, project_id, work_date)`.
- Leave: `project_id IS NULL` + partial unique (0044). Approve must not UPDATE work rows.
- `leave_balances.used_days` only via `recalcUsedDays()`. Audit: `GET /api/leave-balances/audit`.

## Tests

`npm test` — `src/finance.test.ts` (VAT 10% + fee 30% on 1_100_000 → 700_000 booked).
