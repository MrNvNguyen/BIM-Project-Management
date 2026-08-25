import { describe, expect, it } from 'vitest'
import {
  applyWorkDateFilter,
  computeBookedRevenue,
  computeProjectBudget,
  enrichPaymentMetrics,
  monthDateRange,
  taskComputedProgress,
  yearDateRange,
} from './finance'

describe('computeBookedRevenue (migration 0037 example)', () => {
  it('VAT 10% only: 1_100_000 → 1_000_000 booked', () => {
    const r = computeBookedRevenue(1_100_000, 10, 0)
    expect(r.amountBeforeVat).toBe(1_000_000)
    expect(r.bookedRevenue).toBe(1_000_000)
  })

  it('fee 30% only: 1_000_000 → 700_000 booked', () => {
    const r = computeBookedRevenue(1_000_000, 0, 30)
    expect(r.amountBeforeVat).toBe(1_000_000)
    expect(r.bookedRevenue).toBe(700_000)
  })

  it('VAT 10% then fee 30%: 1_100_000 → 700_000 booked', () => {
    const r = computeBookedRevenue(1_100_000, 10, 30)
    expect(r.amountBeforeVat).toBe(1_000_000)
    expect(r.bookedRevenue).toBe(700_000)
  })

  it('zero acceptance yields zeros', () => {
    expect(computeBookedRevenue(0, 10, 30)).toEqual({ amountBeforeVat: 0, bookedRevenue: 0 })
  })
})

describe('computeProjectBudget', () => {
  it('applies management fee', () => {
    expect(computeProjectBudget(10_000_000, 30)).toBe(7_000_000)
  })
  it('zero contract is zero budget', () => {
    expect(computeProjectBudget(0, 30)).toBe(0)
  })
})

describe('date ranges (index-friendly)', () => {
  it('monthDateRange uses exclusive end', () => {
    expect(monthDateRange(2026, 8)).toEqual({ start: '2026-08-01', endExclusive: '2026-09-01' })
    expect(monthDateRange(2026, 12)).toEqual({ start: '2026-12-01', endExclusive: '2027-01-01' })
  })
  it('yearDateRange uses exclusive end', () => {
    expect(yearDateRange(2026)).toEqual({ start: '2026-01-01', endExclusive: '2027-01-01' })
  })
})

describe('enrichPaymentMetrics', () => {
  it('exposes the three money fields', () => {
    const m = enrichPaymentMetrics({ amount: 1_100_000, paid_amount: 500_000, vat_pct: 10 }, 30)
    expect(m.acceptance_amount).toBe(1_100_000)
    expect(m.amount_before_vat).toBe(1_000_000)
    expect(m.booked_revenue).toBe(700_000)
    expect(m.cash_collected).toBe(500_000)
  })
})

describe('applyWorkDateFilter', () => {
  it('uses a half-open month range', () => {
    expect(applyWorkDateFilter(2026, 8, 'ts.work_date')).toEqual({
      sql: ' AND ts.work_date >= ? AND ts.work_date < ?',
      params: ['2026-08-01', '2026-09-01'],
    })
  })
  it('uses a half-open year range', () => {
    expect(applyWorkDateFilter('2026', '', 'work_date')).toEqual({
      sql: ' AND work_date >= ? AND work_date < ?',
      params: ['2026-01-01', '2027-01-01'],
    })
  })
  it('month without year uses the current calendar year', () => {
    const y = new Date().getFullYear()
    expect(applyWorkDateFilter(null, 8, 'work_date')).toEqual({
      sql: ' AND work_date >= ? AND work_date < ?',
      params: [`${y}-08-01`, `${y}-09-01`],
    })
  })
})

describe('taskComputedProgress', () => {
  it('is done/open tasks, not projects.progress', () => {
    expect(taskComputedProgress(4, 1)).toBe(25)
    expect(taskComputedProgress(0, 0)).toBe(0)
  })
})
