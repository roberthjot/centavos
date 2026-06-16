// Dashboard — redesigned 2026. Hero net worth + USD/VES composition bar,
// 3 KPIs, cash-flow SVG chart, expenses-by-category, and a 3-column bottom row
// (recent movements / accounts / goals). Keeps the existing Supabase data layer.
import { useState, useMemo } from 'react'
import type { Account, Transaction, Goal, Budget, Settings } from '../types'
import { useFinance } from '../hooks/useFinance'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  toUSD, currentMonth, formatDisplay, formatNative, groupInt,
} from '../utils/currency'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'

interface DashboardProps {
  accounts: Account[]
  transactions: Transaction[]
  goals: Goal[]
  budgets: Budget[]
  settings: Settings
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void
  onNavigate: (page: 'transactions' | 'goals' | 'accounts') => void
}

// ── Month helpers ─────────────────────────────────────────────
function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthName(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('es-VE', { month: 'long' })
}
function monthShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('es-VE', { month: 'short' }).replace('.', '').slice(0, 3)
}
function dayMonthLabel(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${d} ${new Date(2000, m - 1, 1).toLocaleString('es-VE', { month: 'short' }).replace('.', '').slice(0, 3)}`
}

const TYPE_COLOR: Record<string, string> = { income: '#3ecf8e', expense: '#f0716a', transfer: '#a1a1aa' }
const TYPE_DOT:   Record<string, string> = { income: '#3ecf8e', expense: '#f0716a', transfer: '#52525b' }

// Merge default + custom categories (deduped).
function merge(defaults: readonly string[], customs?: string[]): string[] {
  const set = new Set(defaults)
  return [...defaults, ...(customs ?? []).filter(c => !set.has(c))]
}

const EMPTY_FORM = {
  type: 'expense' as Transaction['type'],
  amount: '', currency: 'USD' as 'USD' | 'VES',
  category: 'Comida', accountId: '', toAccountId: '',
  date: new Date().toISOString().slice(0, 10), note: '',
}

export function Dashboard({
  accounts, transactions, goals, budgets, settings,
  displayCurrency, onCurrencyChange, onAddTransaction, onNavigate,
}: DashboardProps) {
  const isMobile = useIsMobile()
  const finance = useFinance(accounts, transactions, goals, budgets, settings)
  const rate = settings.exchangeRate

  const [month, setMonth] = useState(currentMonth())
  const isCurrentMonth = month === currentMonth()

  // Local format helper bound to the global display currency.
  const fmt = (usd: number) => formatDisplay(usd, displayCurrency, rate)

  // ── Monthly figures (USD-normalized) + month-over-month deltas ────
  const { income, expenses } = finance.getMonthlyTotals(month)
  const netSavings = income - expenses
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0
  const prev = finance.getMonthlyTotals(shiftMonth(month, -1))
  const incDelta = prev.income > 0 ? ((income - prev.income) / prev.income) * 100 : null
  const expDelta = prev.expenses > 0 ? ((expenses - prev.expenses) / prev.expenses) * 100 : null

  const netWorth = finance.netWorth

  // ── USD/VES composition of net worth ─────────────────────────────
  const comp = useMemo(() => {
    let usdNative = 0, vesNative = 0, usdUSD = 0, vesUSD = 0
    for (const a of accounts) {
      const bal = finance.getAccountBalance(a.id)
      if (a.currency === 'USD') { usdNative += bal; usdUSD += bal }
      else { vesNative += bal; vesUSD += toUSD(bal, 'VES', rate) }
    }
    const posUSD = Math.max(usdUSD, 0), posVES = Math.max(vesUSD, 0)
    const total = posUSD + posVES
    const pctUSD = total > 0 ? Math.round((posUSD / total) * 100) : 0
    return { usdNative, vesNative, pctUSD: total > 0 ? pctUSD : 0, pctVES: total > 0 ? 100 - pctUSD : 0, total }
  }, [accounts, finance, rate])

  // ── Net-worth sparkline + change pill (reconstructed from monthly net) ──
  const spark = useMemo(() => {
    const nets = finance.last6MonthsData.map(d => d.income - d.expenses)
    const totalNet = nets.reduce((a, b) => a + b, 0)
    let running = netWorth - totalNet
    const points = nets.map(n => (running += n))
    const min = Math.min(...points), max = Math.max(...points)
    const span = max - min || 1
    const W = 220, H = 46
    const path = points
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${((i * W) / (points.length - 1)).toFixed(1)} ${(4 + (1 - (v - min) / span) * H).toFixed(1)}`)
      .join(' ')
    const a = points[points.length - 2] ?? netWorth
    const b = points[points.length - 1] ?? netWorth
    const changePct = a !== 0 ? ((b - a) / Math.abs(a)) * 100 : 0
    return { path, changePct }
  }, [finance.last6MonthsData, netWorth])

  // ── Cash-flow chart (last 6 months) ──────────────────────────────
  const chart = useMemo(() => {
    const inc = finance.last6MonthsData.map(d => d.income)
    const exp = finance.last6MonthsData.map(d => d.expenses)
    const n = inc.length
    const W = 580, padL = 4, padR = 4, top = 12, bottom = 168
    const max = Math.max(1, ...inc, ...exp)
    const X = (i: number) => padL + (i * (W - padL - padR)) / (n - 1)
    const Y = (v: number) => top + (1 - v / max) * (bottom - top)
    const line = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
    const incLine = line(inc), expLine = line(exp)
    const incArea = `${incLine} L${X(n - 1).toFixed(1)} ${bottom} L${X(0).toFixed(1)} ${bottom} Z`
    return {
      incLine, expLine, incArea,
      endX: X(n - 1), endY: Y(inc[n - 1]),
      ticks: finance.last6MonthsData.map((d, i) => ({ x: X(i), label: monthShort(d.month) })),
    }
  }, [finance.last6MonthsData])

  // ── Expenses by category (top 5) ─────────────────────────────────
  const catBars = useMemo(() => {
    const breakdown = finance.getCategoryBreakdown(month)
    const total = breakdown.reduce((a, c) => a + c.amount, 0) || 1
    return breakdown.slice(0, 5).map(c => ({ name: c.category, amount: c.amount, pct: Math.round((c.amount / total) * 100) }))
  }, [finance, month])

  // ── Bottom-row data ──────────────────────────────────────────────
  const recentTxs = useMemo(() => transactions
    .filter(t => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6), [transactions, month])

  const topGoals = useMemo(() => goals
    .filter(g => g.saved < g.target)
    .sort((a, b) => b.saved / b.target - a.saved / a.target)
    .slice(0, 3), [goals])

  // ── Quick-add modal ──────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const expCats = merge(EXPENSE_CATEGORIES, settings.customExpenseCategories)
  const incCats = merge(INCOME_CATEGORIES, settings.customIncomeCategories)

  const openNew = () => {
    setForm({ ...EMPTY_FORM, currency: displayCurrency, accountId: accounts[0]?.id ?? '', category: expCats[0] })
    setModalOpen(true)
  }
  const setF = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))
  const setType = (t: Transaction['type']) =>
    setForm(p => ({ ...p, type: t, category: t === 'income' ? incCats[0] : t === 'expense' ? expCats[0] : 'Transferencia' }))

  const submit = () => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0 || !form.accountId) return setModalOpen(false)
    if (form.type === 'transfer' && !form.toAccountId) return setModalOpen(false)
    onAddTransaction({
      type: form.type, date: form.date, amount: amt, currency: form.currency,
      category: form.type === 'transfer' ? 'Transferencia' : form.category,
      accountId: form.accountId,
      toAccountId: form.type === 'transfer' ? form.toAccountId : undefined,
      note: form.note || undefined,
    })
    setModalOpen(false)
  }

  // ── Shared bits ──────────────────────────────────────────────────
  const sectionHeader = (title: string, onSee?: () => void, seeLabel = 'Ver →') => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
      <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{title}</span>
      {onSee && (
        <button onClick={onSee} style={{ fontSize: '12px', color: '#71717a' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')}
          onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
          {seeLabel}
        </button>
      )}
    </div>
  )

  const sparkUp = spark.changePct >= 0

  return (
    <div style={{ padding: isMobile ? '20px 16px 40px' : '24px 40px 56px', maxWidth: '1320px', animation: 'cnt-fade .2s ease' }}>
      <Topbar
        pageLabel="Dashboard"
        displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange}
        showMonth monthLabel={monthName(month)}
        onPrevMonth={() => setMonth(m => shiftMonth(m, -1))}
        onNextMonth={() => setMonth(m => shiftMonth(m, +1))}
        nextDisabled={isCurrentMonth}
        newLabel="Nuevo" onNew={openNew}
      />

      {/* ── Hero: net worth + USD/VES composition + sparkline ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '30px',
        paddingBottom: '34px', borderBottom: '1px solid #19191d', marginBottom: '30px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '12px' }}>Patrimonio neto</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ fontSize: isMobile ? '40px' : '54px', fontWeight: 600, letterSpacing: '-.035em', lineHeight: .92 }}>
              {fmt(netWorth)}
            </span>
            <span style={{ fontSize: '13px', color: '#52525b', fontWeight: 500 }}>{displayCurrency}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 600, color: sparkUp ? '#3ecf8e' : '#f0716a' }}>
              <Icon name="arrowUp" size={12} strokeWidth={3} style={{ transform: sparkUp ? 'none' : 'scaleY(-1)' }} />
              {Math.abs(spark.changePct).toFixed(1).replace('.', ',')}%
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: '13px', color: '#52525b', marginTop: '12px' }}>
            {displayCurrency === 'USD' ? `≈ Bs ${groupInt(netWorth * rate)}` : `≈ $${groupInt(netWorth)}`}
          </div>

          {/* Composition bar */}
          <div style={{ marginTop: '24px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', gap: '3px', height: '6px', borderRadius: '99px', overflow: 'hidden', marginBottom: '11px' }}>
              <div style={{ flex: comp.pctUSD || (comp.total === 0 ? 1 : 0), background: '#3ecf8e', borderRadius: '99px' }} />
              <div style={{ flex: comp.pctVES, background: '#cbb389', borderRadius: '99px' }} />
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3ecf8e' }} />
                <span style={{ fontSize: '11.5px', color: '#71717a' }}>USD</span>
                <span className="font-mono" style={{ fontSize: '11.5px', color: '#a1a1aa' }}>{formatNative(comp.usdNative, 'USD')}</span>
                <span style={{ fontSize: '11px', color: '#52525b' }}>{comp.pctUSD}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#cbb389' }} />
                <span style={{ fontSize: '11.5px', color: '#71717a' }}>VES</span>
                <span className="font-mono" style={{ fontSize: '11.5px', color: '#a1a1aa' }}>{formatNative(comp.vesNative, 'VES')}</span>
                <span style={{ fontSize: '11px', color: '#52525b' }}>{comp.pctVES}%</span>
              </div>
            </div>
          </div>
        </div>

        {!isMobile && (
          <svg viewBox="0 0 220 56" preserveAspectRatio="none" style={{ width: '240px', height: '54px', flexShrink: 0, overflow: 'visible' }}>
            <path d={spark.path} fill="none" stroke="#3ecf8e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* ── 3 KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', marginBottom: '38px', gap: isMobile ? '20px' : 0 }}>
        <div style={{ paddingRight: isMobile ? 0 : '24px' }}>
          <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '8px' }}>Ingresos del mes</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
            <span className="font-mono" style={{ fontSize: '24px', fontWeight: 600 }}>{fmt(income)}</span>
            {incDelta !== null && (
              <span style={{ fontSize: '12px', fontWeight: 500, color: incDelta >= 0 ? '#3ecf8e' : '#f0716a' }}>
                {incDelta >= 0 ? '+' : '−'}{Math.abs(incDelta).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: isMobile ? 0 : '0 24px', borderLeft: isMobile ? 'none' : '1px solid #19191d' }}>
          <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '8px' }}>Gastos del mes</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
            <span className="font-mono" style={{ fontSize: '24px', fontWeight: 600 }}>{fmt(expenses)}</span>
            {expDelta !== null && (
              <span style={{ fontSize: '12px', fontWeight: 500, color: expDelta <= 0 ? '#3ecf8e' : '#f0716a' }}>
                {expDelta >= 0 ? '+' : '−'}{Math.abs(expDelta).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: isMobile ? 0 : '0 24px', borderLeft: isMobile ? 'none' : '1px solid #19191d' }}>
          <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '8px' }}>
            Ahorro neto · {savingsRate.toFixed(1).replace('.', ',')}%
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
            <span className="font-mono" style={{ fontSize: '24px', fontWeight: 600, color: netSavings >= 0 ? '#fafafa' : '#f0716a' }}>{fmt(netSavings)}</span>
          </div>
        </div>
      </div>

      {/* ── Cash flow chart + expenses by category ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '40px', marginBottom: '42px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Flujo de caja</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#71717a' }}>
                <span style={{ width: '8px', height: '2px', borderRadius: '2px', background: '#3ecf8e' }} />Ingresos
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#71717a' }}>
                <span style={{ width: '8px', height: '2px', borderRadius: '2px', background: '#52525b' }} />Gastos
              </span>
            </div>
          </div>
          <svg viewBox="0 0 580 200" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            <line x1="2" y1="44" x2="578" y2="44" stroke="#161619" strokeWidth="1" />
            <line x1="2" y1="98" x2="578" y2="98" stroke="#161619" strokeWidth="1" />
            <line x1="2" y1="152" x2="578" y2="152" stroke="#161619" strokeWidth="1" />
            <defs>
              <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0.13" />
                <stop offset="100%" stopColor="#3ecf8e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.incArea} fill="url(#incFill)" />
            <path d={chart.expLine} fill="none" stroke="#52525b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d={chart.incLine} fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={chart.endX} cy={chart.endY} r="6.5" fill="none" stroke="#3ecf8e" strokeOpacity="0.28" strokeWidth="1.5" />
            <circle cx={chart.endX} cy={chart.endY} r="3.5" fill="#3ecf8e" />
            {chart.ticks.map((t, i) => (
              <text key={i} x={t.x} y="195" textAnchor="middle" fontSize="10.5" fontFamily="'JetBrains Mono',monospace" fill="#52525b">{t.label}</text>
            ))}
          </svg>
        </div>

        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '22px' }}>Gastos por categoría</div>
          {catBars.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#52525b', padding: '20px 0' }}>Sin gastos en {monthName(month)}.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {catBars.map(c => (
                <div key={c.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <span style={{ fontSize: '12.5px', color: '#d4d4d8' }}>{c.name}</span>
                    <span className="font-mono" style={{ fontSize: '12px', color: '#71717a' }}>{fmt(c.amount)} · {c.pct}%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '99px', background: '#161619', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', width: `${c.pct}%`, background: '#3f3f46' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: recent / accounts / goals ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr 1fr', gap: isMobile ? '30px' : '40px' }}>
        {/* Recent movements */}
        <div>
          {sectionHeader('Últimos movimientos', () => onNavigate('transactions'), 'Ver todos →')}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentTxs.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#52525b', padding: '12px 0' }}>Sin movimientos en {monthName(month)}.</div>
            ) : recentTxs.map(t => {
              const acc = accounts.find(a => a.id === t.accountId)
              const sign = t.type === 'expense' ? '−' : t.type === 'income' ? '+' : ''
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: '1px solid #161619' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: TYPE_DOT[t.type], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || t.category}</div>
                    <div style={{ fontSize: '11px', color: '#52525b', marginTop: '1px' }}>{acc?.name ?? '—'} · {dayMonthLabel(t.date)}</div>
                  </div>
                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: 500, color: TYPE_COLOR[t.type], whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {sign}{formatNative(t.amount, t.currency)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Accounts */}
        <div>
          {sectionHeader('Cuentas', () => onNavigate('accounts'))}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {accounts.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#52525b', padding: '12px 0' }}>Sin cuentas.</div>
            ) : accounts.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: '1px solid #161619' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#141417', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontSize: '12.5px', fontWeight: 600, flexShrink: 0 }}>
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                  <div style={{ fontSize: '10.5px', color: '#52525b' }}>{a.currency}</div>
                </div>
                <div className="font-mono" style={{ fontSize: '12.5px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {formatNative(finance.getAccountBalance(a.id), a.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          {sectionHeader('Metas', () => onNavigate('goals'))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {topGoals.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#52525b', padding: '12px 0' }}>Sin metas activas.</div>
            ) : topGoals.map(g => {
              const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0
              const savedUSD = toUSD(g.saved, g.currency, rate)
              const targetUSD = toUSD(g.target, g.currency, rate)
              return (
                <div key={g.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: '#d4d4d8' }}>{g.name}</span>
                    <span className="font-mono" style={{ fontSize: '11.5px', color: '#71717a' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '99px', background: '#161619', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', width: `${pct}%`, background: '#3ecf8e' }} />
                  </div>
                  <div className="font-mono" style={{ fontSize: '10.5px', color: '#52525b', marginTop: '6px' }}>{fmt(savedUSD)} / {fmt(targetUSD)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Quick-add modal ── */}
      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: '#0e0e10', border: '1px solid #26262b', borderRadius: '16px', padding: '24px', animation: 'cnt-fade .15s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Nuevo movimiento</h3>
              <button onClick={() => setModalOpen(false)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', background: '#161619', color: '#a1a1aa' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Type */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['income', 'expense', 'transfer'] as const).map(t => {
                  const on = form.type === t
                  const onBg: Record<string, string> = { income: 'rgba(62,207,142,.16)', expense: 'rgba(240,113,106,.16)', transfer: '#26262b' }
                  const onColor: Record<string, string> = { income: '#3ecf8e', expense: '#f0716a', transfer: '#fafafa' }
                  return (
                    <button key={t} onClick={() => setType(t)} style={{
                      flex: 1, height: '34px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, transition: 'all .12s',
                      background: on ? onBg[t] : '#141417', color: on ? onColor[t] : '#71717a',
                    }}>
                      {t === 'income' ? 'Ingreso' : t === 'expense' ? 'Gasto' : 'Transfer.'}
                    </button>
                  )
                })}
              </div>

              {/* Amount + currency */}
              <div>
                <label style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block' }}>Monto</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={form.amount} onChange={e => setF('amount', e.target.value)} placeholder="0,00" inputMode="decimal" style={{ flex: 1 }} />
                  <select value={form.currency} onChange={e => setF('currency', e.target.value)} style={{ width: '90px' }}>
                    <option value="USD">USD</option><option value="VES">VES</option>
                  </select>
                </div>
              </div>

              {/* Category (income/expense only) */}
              {form.type !== 'transfer' && (
                <div>
                  <label style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block' }}>Categoría</label>
                  <select value={form.category} onChange={e => setF('category', e.target.value)}>
                    {(form.type === 'income' ? incCats : expCats).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* Account */}
              <div>
                <label style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block' }}>{form.type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}</label>
                <select value={form.accountId} onChange={e => setF('accountId', e.target.value)}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Destination (transfer only) */}
              {form.type === 'transfer' && (
                <div>
                  <label style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block' }}>Cuenta destino</label>
                  <select value={form.toAccountId} onChange={e => setF('toAccountId', e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {accounts.filter(a => a.id !== form.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              {/* Date + note */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block' }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
                </div>
                <div style={{ flex: 1.4 }}>
                  <label style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block' }}>Nota</label>
                  <input value={form.note} onChange={e => setF('note', e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setModalOpen(false)} style={{ flex: 1, height: '38px', borderRadius: '9px', background: '#161619', color: '#d4d4d8', fontSize: '13px', fontWeight: 500 }}>Cancelar</button>
              <button onClick={submit} style={{ flex: 1, height: '38px', borderRadius: '9px', background: '#3ecf8e', color: '#09271b', fontSize: '13px', fontWeight: 600 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
