// Daily / Weekly / Monthly / Custom period maths shared by the Reports pages (Transactions, VAT).
// Dates are built from local fields — toISOString() converts to UTC first and can shift the calendar day.
const pad = (n) => String(n).padStart(2, '0')
export const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (s) => new Date(`${s}T00:00:00`)
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d) }
const addMonths = (s, n) => { const d = parse(s); d.setDate(1); d.setMonth(d.getMonth() + n); return fmt(d) }
const weekStart = (s) => addDays(s, -((parse(s).getDay() + 6) % 7)) // legacy weeks run Monday–Sunday
const monthEnd = (s) => { const d = parse(s); return fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }

export const DURATIONS = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['custom', 'Custom']]

/** Date window for a duration around an anchor day — same windows legacy's `constructDateOptions*` produced. */
export const windowFor = (duration, anchor) => {
  if (duration === 'weekly') { const from = weekStart(anchor); return { from, to: addDays(from, 6) } }
  if (duration === 'monthly') { const from = `${anchor.slice(0, 7)}-01`; return { from, to: monthEnd(from) } }
  return { from: anchor, to: anchor }
}

export const stepAnchor = (duration, anchor, dir) => {
  if (duration === 'weekly') return addDays(weekStart(anchor), 7 * dir)
  if (duration === 'monthly') return addMonths(anchor, dir)
  return addDays(anchor, dir)
}

export const periodLabel = ({ from, to }, duration) => (duration === 'daily' ? from : `${from} to ${to}`)
