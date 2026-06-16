// ===== CENTAVOS — Currency Utilities =====

/**
 * Convert an amount to USD using the current exchange rate.
 * @param amount   - Original amount in its native currency
 * @param currency - 'USD' | 'VES'
 * @param rate     - Exchange rate: 1 USD = rate VES
 */
export function toUSD(amount: number, currency: 'USD' | 'VES', rate: number): number {
  if (currency === 'USD') return amount
  return rate > 0 ? amount / rate : 0
}

/**
 * Convert a USD amount to VES using the current exchange rate.
 * @param amount - Amount in USD
 * @param rate   - Exchange rate: 1 USD = rate VES
 */
export function toVES(amount: number, rate: number): number {
  return amount * rate
}

/**
 * Format a number as a USD string with 2 decimal places.
 * E.g.: 1234.5 → "$1,234.50"
 */
export function formatUSD(amount: number): string {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${amount < 0 ? '-' : ''}$${formatted}`
}

/**
 * Format a number as a VES string with 2 decimal places.
 * E.g.: 50000 → "Bs. 50,000.00"
 */
export function formatVES(amount: number): string {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${amount < 0 ? '-' : ''}Bs. ${formatted}`
}

/**
 * Format an amount in its native currency.
 * Delegates to formatUSD or formatVES based on the currency parameter.
 */
export function formatAmount(amount: number, currency: 'USD' | 'VES'): string {
  return currency === 'USD' ? formatUSD(amount) : formatVES(amount)
}

/**
 * Format a number compactly for KPI cards (e.g. $12.5k, $1.2M).
 */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return `${sign}$${abs.toFixed(2)}`
}

/* ===== 2026 redesign display helpers =====
 * The redesign renders whole-number amounts with locale thousands separators
 * (de-DE → "5.213") and a real minus sign. A single global toggle (USD/VES)
 * decides how USD-normalized values are shown.
 */

/** Group an integer with de-DE separators ("5.213") and a real minus sign. */
export function groupInt(n: number): string {
  const neg = n < 0
  const abs = Math.abs(Math.round(n))
  return (neg ? '−' : '') + abs.toLocaleString('de-DE')
}

/**
 * Format a USD-normalized amount in the chosen display currency.
 * @param amountUSD - value already normalized to USD
 * @param display   - 'USD' | 'VES'
 * @param rate      - 1 USD = rate VES
 */
export function formatDisplay(amountUSD: number, display: 'USD' | 'VES', rate: number): string {
  return display === 'VES' ? `Bs ${groupInt(amountUSD * rate)}` : `$${groupInt(amountUSD)}`
}

/** Format an amount in its own native currency (whole numbers, grouped). */
export function formatNative(amount: number, currency: 'USD' | 'VES'): string {
  return currency === 'VES' ? `Bs ${groupInt(amount)}` : `$${groupInt(amount)}`
}

/**
 * Get the current YYYY-MM string for the current month.
 */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

/**
 * Get a YYYY-MM string for N months ago from today.
 */
export function monthsAgo(n: number): string {
  const d = new Date()
  d.setDate(1) // prevent day overflow (e.g. Jan 31 - 1 month = Feb 31 → Mar 3)
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Format a YYYY-MM string to a short human-readable label.
 * E.g.: "2025-03" → "Mar 25"
 */
export function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-VE', { month: 'short', year: '2-digit' })
}

/** Long month name, capitalized — e.g. "2026-06" → "Junio". */
export function monthLongLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-').map(Number)
  const name = new Date(y, m - 1, 1).toLocaleString('es-VE', { month: 'long' })
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Shift a YYYY-MM string by a number of months. */
export function shiftMonth(yyyyMM: string, delta: number): string {
  const [y, m] = yyyyMM.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
