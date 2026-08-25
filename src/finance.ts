/** Single source of truth for money, dates, and labor allocation. */

export const TASK_OVERDUE_SQL =
  `due_date IS NOT NULL AND due_date < date('now') AND status NOT IN ('completed','review','cancelled')`

export const TASK_DONE_SQL = `status IN ('completed','review')`
export const TASK_OPEN_TOTAL_SQL = `status != 'cancelled'`

export function computeBookedRevenue(
  acceptanceAmount: number,
  vatPct: number,
  feePct: number
): { amountBeforeVat: number; bookedRevenue: number } {
  const rawAmount = Number(acceptanceAmount) || 0
  const vat = Number(vatPct) || 0
  const fee = Number(feePct) || 0
  const amountBeforeVat = vat > 0 ? Math.round(rawAmount / (1 + vat / 100)) : rawAmount
  const bookedRevenue = fee > 0 ? Math.round(amountBeforeVat * (1 - fee / 100)) : amountBeforeVat
  return { amountBeforeVat, bookedRevenue }
}

export function computeProjectBudget(contractValue: number, feePct: number): number {
  const cv = Number(contractValue) || 0
  const fee = Number(feePct) || 0
  return cv > 0 ? Math.round(cv * (1 - fee / 100)) : 0
}

export function monthDateRange(year: number, month: number): { start: string; endExclusive: string } {
  const y = Number(year)
  const m = Number(month)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const nextM = m === 12 ? 1 : m + 1
  const nextY = m === 12 ? y + 1 : y
  return { start, endExclusive: `${nextY}-${String(nextM).padStart(2, '0')}-01` }
}

export function yearDateRange(year: number): { start: string; endExclusive: string } {
  const y = Number(year)
  return { start: `${y}-01-01`, endExclusive: `${y + 1}-01-01` }
}

/** Index-friendly date predicate. Prefer this over strftime('%Y'/'%m'). */
export function applyWorkDateFilter(
  year?: string | number | null,
  month?: string | number | null,
  col = 'work_date'
): { sql: string; params: string[] } {
  const y = year != null && year !== '' ? Number(year) : 0
  const m = month != null && month !== '' ? Number(month) : 0
  if (m && !y) {
    return applyWorkDateFilter(new Date().getFullYear(), m, col)
  }
  if (y && m) {
    const { start, endExclusive } = monthDateRange(y, m)
    return { sql: ` AND ${col} >= ? AND ${col} < ?`, params: [start, endExclusive] }
  }
  if (y) {
    const { start, endExclusive } = yearDateRange(y)
    return { sql: ` AND ${col} >= ? AND ${col} < ?`, params: [start, endExclusive] }
  }
  return { sql: '', params: [] }
}

export function taskComputedProgress(totalTasks: number, doneTasks: number): number {
  const total = Number(totalTasks) || 0
  const done = Number(doneTasks) || 0
  return total > 0 ? Math.round((done / total) * 100) : 0
}

export function paymentStatusToRevenue(status: string): string {
  if (status === 'paid') return 'paid'
  if (status === 'partial') return 'partial'
  return 'pending'
}

export function enrichPaymentMetrics(payment: {
  amount?: number
  paid_amount?: number
  vat_pct?: number | null
}, feePct: number) {
  const acceptance = Number(payment.amount) || 0
  const { amountBeforeVat, bookedRevenue } = computeBookedRevenue(
    acceptance,
    payment.vat_pct ?? 0,
    feePct
  )
  return {
    acceptance_amount: acceptance,
    amount_before_vat: amountBeforeVat,
    booked_revenue: bookedRevenue,
    cash_collected: Number(payment.paid_amount) || 0,
  }
}

export function enrichRevenueRow(row: {
  amount?: number
  paid_amount_original?: number
  paid_amount?: number
  vat_pct?: number
  fee_pct?: number
  payment_status?: string
  source?: string
}) {
  const feePct = Number(row.fee_pct) || 0
  const vatPct = Number(row.vat_pct) || 0
  const isPendingPayment = row.source === 'payment_request' || row.payment_status === 'pending'
  const acceptance = Number(row.paid_amount_original ?? (isPendingPayment ? row.amount : row.paid_amount_original)) || 0
  const fallbackAcceptance = acceptance || Number(row.amount) || 0
  const { amountBeforeVat, bookedRevenue } = computeBookedRevenue(fallbackAcceptance, vatPct, feePct)
  return {
    ...row,
    acceptance_amount: fallbackAcceptance,
    amount_before_vat: amountBeforeVat,
    booked_revenue: isPendingPayment ? bookedRevenue : (Number(row.amount) || bookedRevenue),
    cash_collected: Number(row.paid_amount) || 0,
  }
}

export async function syncPaymentToRevenue(
  db: D1Database,
  payment: {
    id: number
    project_id: number
    description: string
    amount: number
    paid_amount: number
    currency: string
    paid_date: string | null
    invoice_number: string | null
    payment_phase: string | null
    status: string
    revenue_id: number | null
    notes: string | null
    vat_pct?: number | null
  },
  userId: number
): Promise<number | null> {
  const rawAmount = payment.amount || 0
  const shouldSync = rawAmount > 0

  const projRow = await db.prepare(
    'SELECT management_fee_pct FROM projects WHERE id = ?'
  ).bind(payment.project_id).first() as { management_fee_pct?: number } | null
  const feePct = (projRow?.management_fee_pct || 0) as number
  const vatPct = (payment.vat_pct != null ? payment.vat_pct : 0) as number
  const { amountBeforeVat, bookedRevenue: syncAmount } = computeBookedRevenue(rawAmount, vatPct, feePct)

  if (!shouldSync) {
    if (payment.revenue_id) {
      await db.prepare('DELETE FROM project_revenues WHERE id = ?').bind(payment.revenue_id).run()
      await db.prepare('UPDATE payment_requests SET revenue_id = NULL WHERE id = ?').bind(payment.id).run()
    }
    return null
  }

  const revenueDesc = payment.payment_phase
    ? `[${payment.payment_phase}] ${payment.description}`
    : payment.description
  const revenueStatus = paymentStatusToRevenue(payment.status)
  const revenueDate = payment.status === 'pending' ? null : (payment.paid_date || null)

  let calcNote = ''
  if (vatPct > 0 && feePct > 0) {
    calcNote = `\n[NT: ${rawAmount.toLocaleString('vi-VN')} VNĐ ÷ ${(100 + vatPct)}% = ${amountBeforeVat.toLocaleString('vi-VN')} VNĐ trước thuế → Phí QL ${feePct}%: × ${(100 - feePct)}% = ${syncAmount.toLocaleString('vi-VN')} VNĐ doanh thu]`
  } else if (vatPct > 0) {
    calcNote = `\n[NT: ${rawAmount.toLocaleString('vi-VN')} VNĐ ÷ ${(100 + vatPct)}% = ${syncAmount.toLocaleString('vi-VN')} VNĐ trước thuế]`
  } else if (feePct > 0) {
    calcNote = `\n[NT: ${rawAmount.toLocaleString('vi-VN')} VNĐ × ${(100 - feePct)}% = ${syncAmount.toLocaleString('vi-VN')} VNĐ]`
  }
  const paidRef = payment.paid_amount > 0
    ? `\n[Dòng tiền thực thu: ${payment.paid_amount.toLocaleString('vi-VN')} VNĐ]`
    : ''
  const revenueNotes = `[Đồng bộ từ Hồ Sơ Pháp Lý - Giá trị nghiệm thu]${calcNote}${paidRef}${payment.notes ? '\n' + payment.notes : ''}`

  if (payment.revenue_id) {
    await db.prepare(`
      UPDATE project_revenues
      SET description = ?, amount = ?, amount_original = ?, currency = ?, revenue_date = ?,
          invoice_number = ?, payment_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      revenueDesc, syncAmount, rawAmount, payment.currency || 'VND',
      revenueDate, payment.invoice_number || null,
      revenueStatus, revenueNotes, payment.revenue_id
    ).run()
    return payment.revenue_id
  }

  const result = await db.prepare(`
    INSERT INTO project_revenues
      (project_id, description, amount, amount_original, currency, revenue_date, invoice_number, payment_status, notes, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).bind(
    payment.project_id, revenueDesc, syncAmount, rawAmount, payment.currency || 'VND',
    revenueDate, payment.invoice_number || null,
    revenueStatus, revenueNotes, userId
  ).run()
  return result.meta.last_row_id as number
}

/** Labor KPI: monthly_labor_costs allocated by timesheet hours. Not project_labor_costs cache. */
export async function computeProjectLaborFromTimesheets(
  db: D1Database,
  projectId: number,
  overtimeFactor: number
): Promise<number> {
  const mlc = await db.prepare(
    `SELECT month, year, total_labor_cost FROM monthly_labor_costs WHERE total_labor_cost > 0`
  ).all()
  let laborCost = 0
  for (const row of (mlc.results || []) as { month: number; year: number; total_labor_cost: number }[]) {
    const { start, endExclusive } = monthDateRange(row.year, row.month)
    const projHrsRow = await db.prepare(`
      SELECT
        SUM(regular_hours + IFNULL(overtime_hours, 0)) as proj_raw,
        SUM(regular_hours + IFNULL(overtime_hours, 0) * ?) as proj_eff
      FROM timesheets
      WHERE project_id = ? AND work_date >= ? AND work_date < ?
    `).bind(overtimeFactor, projectId, start, endExclusive).first() as { proj_raw?: number; proj_eff?: number } | null
    const compHrsRow = await db.prepare(`
      SELECT SUM(regular_hours + IFNULL(overtime_hours, 0) * ?) as comp_eff
      FROM timesheets WHERE work_date >= ? AND work_date < ?
    `).bind(overtimeFactor, start, endExclusive).first() as { comp_eff?: number } | null
    const projRaw = projHrsRow?.proj_raw || 0
    const projEff = projHrsRow?.proj_eff || 0
    const compEff = compHrsRow?.comp_eff || 0
    if (projRaw <= 0 || compEff <= 0) continue
    laborCost += Math.round(projEff * (row.total_labor_cost / compEff))
  }
  return laborCost
}

export async function resolveAssigneeNames(db: D1Database, idsJson: string | null): Promise<string> {
  let ids: number[] = []
  try { ids = JSON.parse(idsJson || '[]') } catch { ids = [] }
  if (!Array.isArray(ids) || ids.length === 0) return ''
  const placeholders = ids.map(() => '?').join(',')
  const rows = await db.prepare(
    `SELECT id, full_name FROM users WHERE id IN (${placeholders})`
  ).bind(...ids).all()
  const nameById = new Map((rows.results as { id: number; full_name: string }[]).map(u => [u.id, u.full_name]))
  return ids.map(id => nameById.get(id) || `#${id}`).join(', ')
}
