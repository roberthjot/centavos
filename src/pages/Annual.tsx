// Annual summary page — income, expenses, and net savings for each month of a year
import { useState } from 'react'
import type { Account, Transaction, Goal, Budget, Settings } from '../types'
import { useFinance } from '../hooks/useFinance'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatUSD } from '../utils/currency'
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
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#131328', border: '1px solid #18183a',
      borderRadius: '8px', padding: '10px 14px',
      fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <div style={{ color: '#6b6b9e', marginBottom: '6px', textTransform: 'capitalize' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {formatUSD(p.value)}
        </div>
      ))}
    </div>
  )
}

export function Annual({ accounts, transactions, goals, budgets, settings }: AnnualProps) {
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
      background: '#0c0c1e', border: '1px solid #18183a',
      borderLeft: `3px solid ${color}`, borderRadius: '10px',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: '11px', color: '#6b6b9e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: pad, maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '20px' : '24px', color: '#eeeef8' }}>
          Resumen Anual
        </h1>

        {/* Year navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setYear(y => y - 1)}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#8b5cf6', fontSize: '18px', borderRadius: '6px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#8b5cf618')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ‹
          </button>
          <span style={{ minWidth: '60px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: year === thisYear ? '#eeeef8' : '#8b5cf6', fontFamily: "'IBM Plex Mono', monospace" }}>
            {year}
          </span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= thisYear}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: year >= thisYear ? 'default' : 'pointer', color: year >= thisYear ? '#2a2a4a' : '#8b5cf6', fontSize: '18px', borderRadius: '6px' }}
            onMouseEnter={e => { if (year < thisYear) e.currentTarget.style.background = '#8b5cf618' }}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ›
          </button>
        </div>
      </div>

      {/* Year KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px', marginBottom: '28px' }}>
        {statCard('Ingresos totales', formatUSD(yearTotals.income), '#10d97a')}
        {statCard('Gastos totales',   formatUSD(yearTotals.expenses), '#f43f5e')}
        {statCard('Ahorro neto',      formatUSD(yearNet), yearNet >= 0 ? '#10d97a' : '#f43f5e', `${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}% del ingreso`)}
        {statCard(
          'Mejor mes',
          bestMonth.income + bestMonth.expenses > 0 ? bestMonth.label : '—',
          '#8b5cf6',
          bestMonth.income + bestMonth.expenses > 0 ? `Ahorro: ${formatUSD(bestMonth.net)}` : 'Sin datos',
        )}
      </div>

      {/* Bar chart */}
      <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', padding: '20px', marginBottom: '28px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#eeeef8' }}>
          Ingresos vs Gastos — {year}
        </h2>
        <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18183a" />
            <XAxis dataKey="label" stroke="#6b6b9e" tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} />
            <YAxis stroke="#6b6b9e" tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ fontSize: '11px', color: '#6b6b9e' }}>{v}</span>} />
            <ReferenceLine y={0} stroke="#18183a" />
            <Bar dataKey="income"   name="Ingresos" fill="#10d97a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Gastos"   fill="#f43f5e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #18183a' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#eeeef8' }}>
            Detalle mensual — {year}
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #18183a' }}>
                {['Mes', 'Ingresos', 'Gastos', 'Neto', 'Ahorro %'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right',
                    fontSize: '11px', color: '#6b6b9e', fontWeight: 600,
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
                      borderBottom: '1px solid #18183a',
                      background: isCurrentMonth ? '#8b5cf608' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: isCurrentMonth ? '#8b5cf6' : '#eeeef8', fontWeight: isCurrentMonth ? 600 : 400, textTransform: 'capitalize' }}>
                      {isCurrentMonth && <span style={{ marginRight: '6px' }}>→</span>}
                      {m.label}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? '#10d97a' : '#2a2a4a', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {hasData ? formatUSD(m.income) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? '#f43f5e' : '#2a2a4a', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {hasData ? formatUSD(m.expenses) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? (net >= 0 ? '#10d97a' : '#f43f5e') : '#2a2a4a', textAlign: 'right', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {hasData ? `${net >= 0 ? '+' : ''}${formatUSD(net)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: hasData ? (rate >= 0 ? '#10d97a' : '#f43f5e') : '#2a2a4a', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {hasData ? `${rate.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
              {/* Year total row */}
              <tr style={{ background: '#131328', borderTop: '2px solid #18183a' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#eeeef8', fontWeight: 700 }}>TOTAL {year}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#10d97a', textAlign: 'right', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatUSD(yearTotals.income)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#f43f5e', textAlign: 'right', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatUSD(yearTotals.expenses)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: yearNet >= 0 ? '#10d97a' : '#f43f5e', textAlign: 'right', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {`${yearNet >= 0 ? '+' : ''}${formatUSD(yearNet)}`}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: savingsRate >= 0 ? '#10d97a' : '#f43f5e', textAlign: 'right', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {yearTotals.income > 0 ? `${savingsRate.toFixed(1)}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Note about worst month */}
        {worstMonth.income + worstMonth.expenses > 0 && worstMonth.net < 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #18183a', fontSize: '12px', color: '#6b6b9e' }}>
            ⚠ Peor mes: <strong style={{ color: '#f43f5e' }}>{worstMonth.label}</strong> — déficit de {formatUSD(Math.abs(worstMonth.net))}
          </div>
        )}
      </div>
    </div>
  )
}
