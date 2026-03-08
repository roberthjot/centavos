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
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 7)
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
