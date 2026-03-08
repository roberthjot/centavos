// Dashboard page — KPI cards, area chart, pie chart, recent transactions, goals preview
import type { Account, Transaction, Goal, Budget, Settings } from '../types'
import { useFinance } from '../hooks/useFinance'
import { formatUSD, formatVES, formatAmount, toUSD, currentMonth } from '../utils/currency'
import { KPICard } from '../components/ui/KPICard'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts'

interface DashboardProps {
  accounts: Account[]
  transactions: Transaction[]
  goals: Goal[]
  budgets: Budget[]
  settings: Settings
  onNavigate: (page: 'transactions' | 'goals' | 'accounts') => void
}

// Custom dark tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#131328',
      border: '1px solid #18183a',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <div style={{ color: '#6b6b9e', marginBottom: '6px' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {formatUSD(p.value)}
        </div>
      ))}
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{
      background: '#131328',
      border: '1px solid #18183a',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <div style={{ color: item.payload.color }}>{item.name}</div>
      <div style={{ color: '#eeeef8', fontWeight: 600 }}>{formatUSD(item.value)}</div>
    </div>
  )
}

export function Dashboard({ accounts, transactions, goals, budgets, settings, onNavigate }: DashboardProps) {
  const finance = useFinance(accounts, transactions, goals, budgets, settings)
  const month = currentMonth()
  const { income, expenses } = finance.getMonthlyTotals(month)
  const netSavings = income - expenses
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0

  const categoryBreakdown = finance.getCategoryBreakdown(month)
  const recentTxs = finance.getRecentTransactions(6)
  const topGoals = goals
    .filter(g => g.saved < g.target)
    .sort((a, b) => b.saved / b.target - a.saved / a.target)
    .slice(0, 3)


  const TYPE_COLOR: Record<string, string> = {
    income: '#10d97a',
    expense: '#f43f5e',
    transfer: '#38bdf8',
  }

  const section = (title: string, action?: { label: string; onClick: () => void }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    }}>
      <h2 style={{
        margin: 0,
        fontSize: '14px',
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        color: '#eeeef8',
      }}>
        {title}
      </h2>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: '12px',
            color: '#8b5cf6',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {action.label} →
        </button>
      )}
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Page title */}
      <h1 style={{
        margin: '0 0 28px 0',
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: '24px',
        color: '#eeeef8',
      }}>
        Dashboard
      </h1>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <KPICard
          title="Patrimonio Neto"
          value={formatUSD(finance.netWorth)}
          subtitle={`≈ ${formatVES(finance.netWorth * settings.exchangeRate)}`}
          accentColor="#8b5cf6"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
        <KPICard
          title="Ingresos del mes"
          value={formatUSD(income)}
          subtitle={month}
          accentColor="#10d97a"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        />
        <KPICard
          title="Gastos del mes"
          value={formatUSD(expenses)}
          subtitle={month}
          accentColor="#f43f5e"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
        />
        <KPICard
          title="Ahorro neto"
          value={formatUSD(netSavings)}
          subtitle={`${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}% del ingreso`}
          accentColor={netSavings >= 0 ? '#10d97a' : '#f43f5e'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', marginBottom: '32px' }}>
        {/* Area Chart */}
        <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', padding: '20px' }}>
          {section('Ingresos vs Gastos — últimos 6 meses')}
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={finance.last6MonthsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10d97a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10d97a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18183a" />
              <XAxis dataKey="label" stroke="#6b6b9e" tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
              <YAxis stroke="#6b6b9e" tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Ingresos" stroke="#10d97a" fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#f43f5e" fill="url(#colorExpenses)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', padding: '20px' }}>
          {section('Gastos por categoría')}
          {categoryBreakdown.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#6b6b9e', fontSize: '13px' }}>
              Sin gastos este mes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="40%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={8}
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ fontSize: '11px', color: '#6b6b9e', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Account Balances */}
        <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', padding: '20px' }}>
          {section('Cuentas', { label: 'Ver todas', onClick: () => onNavigate('accounts') })}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {accounts.map(acc => {
              const bal = finance.getAccountBalance(acc.id)
              const isNeg = bal < 0
              return (
                <div key={acc.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: '#131328',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${acc.color}`,
                }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#eeeef8', fontWeight: 500 }}>{acc.name}</div>
                    <div style={{ fontSize: '11px', color: '#6b6b9e' }}>{acc.currency}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isNeg ? '#f43f5e' : '#eeeef8' }}>
                      {formatAmount(bal, acc.currency)}
                    </div>
                    {acc.currency === 'VES' && (
                      <div style={{ fontSize: '11px', color: '#6b6b9e' }}>
                        ≈ {formatUSD(toUSD(bal, 'VES', settings.exchangeRate))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {accounts.length === 0 && (
              <div style={{ color: '#6b6b9e', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                Sin cuentas
              </div>
            )}
          </div>
          {accounts.length > 0 && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#131328', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#6b6b9e' }}>Total (USD)</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6' }}>{formatUSD(finance.netWorth)}</span>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', padding: '20px' }}>
          {section('Últimas transacciones', { label: 'Ver todas', onClick: () => onNavigate('transactions') })}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentTxs.length === 0 ? (
              <div style={{ color: '#6b6b9e', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                Sin transacciones
              </div>
            ) : recentTxs.map(tx => {
              const acc = accounts.find(a => a.id === tx.accountId)
              const color = TYPE_COLOR[tx.type] ?? '#6b6b9e'
              const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : '⇄'
              return (
                <div key={tx.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: '#131328',
                  borderRadius: '6px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#eeeef8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {tx.note || tx.category}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b6b9e' }}>
                      {acc?.name} · {tx.date.slice(5).replace('-', '/')}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color, marginLeft: '10px', flexShrink: 0 }}>
                    {sign}{formatAmount(tx.amount, tx.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Goals Preview */}
        <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', padding: '20px' }}>
          {section('Metas de ahorro', { label: 'Ver todas', onClick: () => onNavigate('goals') })}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topGoals.length === 0 ? (
              <div style={{ color: '#6b6b9e', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                Sin metas activas
              </div>
            ) : topGoals.map(g => {
              const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0
              const barColor = pct > 70 ? '#f59e0b' : '#8b5cf6'
              return (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#eeeef8' }}>
                      {g.emoji} {g.name}
                    </span>
                    <span style={{ fontSize: '12px', color: barColor }}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <ProgressBar value={pct} color={barColor} height={6} />
                  <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '4px' }}>
                    {formatAmount(g.saved, g.currency)} / {formatAmount(g.target, g.currency)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
