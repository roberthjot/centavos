// Annual summary page — income, expenses, and net savings for each month of a year
import { useState } from 'react'
import type { Account, Transaction, Goal, Budget, Settings } from '../types'
import { useFinance } from '../hooks/useFinance'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatUSD } from '../utils/currency'
import { Topbar } from '../components/layout/Topbar'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface AnnualProps {
  accounts: Account[]
  transactions: Transaction[]
  goals: Goal[]
  budgets: Budget[]
  settings: Settings
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#141417', border: '1px solid #1c1c1f',
      borderRadius: '8px', padding: '10px 14px',
      fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ color: '#71717a', marginBottom: '6px', textTransform: 'capitalize' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {formatUSD(p.value)}
        </div>
      ))}
    </div>
  )
}

export function Annual({ accounts, transactions, goals, budgets, settings, displayCurrency, onCurrencyChange }: AnnualProps) {
  const isMobile  = useIsMobile()
  const finance   = useFinance(accounts, transactions, goals, budgets, settings)
  const thisYear  = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)

  const monthlyData = finance.getAnnualData(year)

  const yearTotals = monthlyData.reduce(
    (acc, m) => ({ income: acc.income + m.income, expenses: acc.expenses + m.expenses }),
    { income: 0, expenses: 0 },
  )
  const yearNet    = yearTotals.income - yearTotals.expenses
  const savingsRate = yearTotals.income > 0 ? (yearNet / yearTotals.income) * 100 : 0

  const bestMonth  = [...monthlyData].sort((a, b) => b.net - a.net)[0]
  const worstMonth = [...monthlyData].sort((a, b) => a.net - b.net)[0]

  const pad = isMobile ? '16px' : '32px'

  const statCard = (label: string, value: string, color: string, sub?: string) => (
    <div style={{
      background: '#0e0e10', border: '1px solid #1c1c1f',
      borderLeft: `3px solid ${color}`, borderRadius: '10px',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: pad, maxWidth: '1000px', animation: 'cnt-fade .2s ease' }}>
      <Topbar pageLabel="Anual" displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-.02em', color: '#fafafa' }}>
          Resumen Anual
        </h1>

        {/* Year navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setYear(y => y - 1)}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#3ecf8e', fontSize: '18px', borderRadius: '6px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3ecf8e18')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ‹
          </button>
          <span style={{ minWidth: '60px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: year === thisYear ? '#fafafa' : '#3ecf8e', fontFamily: "'JetBrains Mono', monospace" }}>
            {year}
          </span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= thisYear}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: year >= thisYear ? 'default' : 'pointer', color: year >= thisYear ? '#3a3a40' : '#3ecf8e', fontSize: '18px', borderRadius: '6px' }}
            onMouseEnter={e => { if (year < thisYear) e.currentTarget.style.background = '#3ecf8e18' }}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ›
          </button>
        </div>
      </div>

      {/* Year KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px', marginBottom: '28px' }}>
        {statCard('Ingresos totales', formatUSD(yearTotals.income), '#3ecf8e')}
        {statCard('Gastos totales',   formatUSD(yearTotals.expenses), '#f0716a')}
        {statCard('Ahorro neto',      formatUSD(yearNet), yearNet >= 0 ? '#3ecf8e' : '#f0716a', `${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}% del ingreso`)}
        {statCard(
          'Mejor mes',
          bestMonth.income + bestMonth.expenses > 0 ? bestMonth.label : '—',
          '#3ecf8e',
          bestMonth.income + bestMonth.expenses > 0 ? `Ahorro: ${formatUSD(bestMonth.net)}` : 'Sin datos',
        )}
      </div>

      {/* Bar chart */}
      <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '10px', padding: '20px', marginBottom: '28px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '14px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#fafafa' }}>
          Ingresos vs Gastos — {year}
        </h2>
        <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
            <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ fontSize: '11px', color: '#71717a' }}>{v}</span>} />
            <ReferenceLine y={0} stroke="#1c1c1f" />
            <Bar dataKey="income"   name="Ingresos" fill="#3ecf8e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Gastos"   fill="#f0716a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1f' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#fafafa' }}>
            Detalle mensual — {year}
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1c1c1f' }}>
                {['Mes', 'Ingresos', 'Gastos', 'Neto', 'Ahorro %'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right',
                    fontSize: '11px', color: '#71717a', fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, i) => {
                const net = m.income - m.expenses
                const rate = m.income > 0 ? (net / m.income) * 100 : 0
                const hasData = m.income > 0 || m.expenses > 0
                const isCurrentMonth = `${year}-${String(i + 1).padStart(2, '0')}` ===
                  new Date().toISOString().slice(0, 7)
                return (
                  <tr
                    key={m.month}
                    style={{
                      borderBottom: '1px solid #1c1c1f',
                      background: isCurrentMonth ? '#3ecf8e08' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: isCurrentMonth ? '#3ecf8e' : '#fafafa', fontWeight: isCurrentMonth ? 600 : 400, textTransform: 'capitalize' }}>
                      {isCurrentMonth && <span style={{ marginRight: '6px' }}>→</span>}
                      {m.label}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? '#3ecf8e' : '#3a3a40', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                      {hasData ? formatUSD(m.income) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? '#f0716a' : '#3a3a40', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                      {hasData ? formatUSD(m.expenses) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? (net >= 0 ? '#3ecf8e' : '#f0716a') : '#3a3a40', textAlign: 'right', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                      {hasData ? `${net >= 0 ? '+' : ''}${formatUSD(net)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? (rate >= 0 ? '#3ecf8e' : '#f0716a') : '#3a3a40', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                      {hasData ? `${rate.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
              {/* Year total row */}
              <tr style={{ background: '#141417', borderTop: '2px solid #1c1c1f' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#fafafa', fontWeight: 700 }}>TOTAL {year}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#3ecf8e', textAlign: 'right', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatUSD(yearTotals.income)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#f0716a', textAlign: 'right', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatUSD(yearTotals.expenses)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: yearNet >= 0 ? '#3ecf8e' : '#f0716a', textAlign: 'right', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {`${yearNet >= 0 ? '+' : ''}${formatUSD(yearNet)}`}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: savingsRate >= 0 ? '#3ecf8e' : '#f0716a', textAlign: 'right', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {yearTotals.income > 0 ? `${savingsRate.toFixed(1)}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Note about worst month */}
        {worstMonth.income + worstMonth.expenses > 0 && worstMonth.net < 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #1c1c1f', fontSize: '12px', color: '#71717a' }}>
            ⚠ Peor mes: <strong style={{ color: '#f0716a' }}>{worstMonth.label}</strong> — déficit de {formatUSD(Math.abs(worstMonth.net))}
          </div>
        )}
      </div>
    </div>
  )
}
