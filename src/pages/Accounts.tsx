// Accounts page — account cards grid with add/delete, wealth summary, and balance history chart
import { useState } from 'react'
import type { Account, Transaction, Settings } from '../types'
import { formatUSD, formatAmount, toUSD } from '../utils/currency'
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '../utils/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { AccountCard } from '../components/ui/AccountCard'
import { ColorPicker } from '../components/ui/ColorPicker'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { EmptyState } from '../components/ui/EmptyState'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useFinance } from '../hooks/useFinance'

interface AccountsProps {
  accounts: Account[]
  transactions: Transaction[]
  settings: Settings
  getBalance: (id: string) => number
  getTransactionCount: (id: string) => number
  onAdd:    (account: Omit<Account, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  name: '',
  type: 'cash' as Account['type'],
  currency: 'USD' as 'USD' | 'VES',
  initialBalance: '',
  color: ACCOUNT_COLORS[0] as string,
}

export function Accounts({ accounts, transactions, settings, getBalance, getTransactionCount, onAdd, onUpdate, onDelete }: AccountsProps) {
  const isMobile = useIsMobile()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showHistory, setShowHistory] = useState(false)

  // Use finance hook to get balance history per account
  const finance = useFinance(accounts, transactions, [], [], settings)

  const netWorth = accounts.reduce(
    (sum, acc) => sum + toUSD(getBalance(acc.id), acc.currency, settings.exchangeRate),
    0,
  )

  const handleAdd = () => {
    if (!form.name) return
    onAdd({
      name: form.name,
      type: form.type,
      currency: form.currency,
      initialBalance: parseFloat(form.initialBalance) || 0,
      color: form.color,
    })
    setForm(EMPTY_FORM)
    setModalOpen(false)
  }

  const f = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const pad = isMobile ? '16px' : '32px'

  return (
    <div style={{ padding: pad }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '20px' : '24px', color: '#eeeef8' }}>
          Cuentas
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: '10px 18px',
            background: '#8b5cf6',
            color: '#eeeef8',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#7c3aed')}
          onMouseLeave={e => (e.currentTarget.style.background = '#8b5cf6')}
        >
          + Agregar cuenta
        </button>
      </div>

      {/* Wealth summary */}
      <div style={{
        background: '#0c0c1e',
        border: '1px solid #18183a',
        borderLeft: '3px solid #8b5cf6',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '13px', color: '#6b6b9e' }}>Patrimonio total (USD)</span>
        <span style={{ fontSize: '22px', fontWeight: 600, color: '#8b5cf6' }}>
          {formatUSD(netWorth)}
        </span>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          emoji="🏦"
          title="Sin cuentas"
          description="Agrega tu primera cuenta para comenzar a registrar tus finanzas."
          ctaLabel="+ Agregar cuenta"
          onCta={() => setModalOpen(true)}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              balance={getBalance(acc.id)}
              transactionCount={getTransactionCount(acc.id)}
              exchangeRate={settings.exchangeRate}
              onEdit={onUpdate}
              onDelete={() => onDelete(acc.id)}
            />
          ))}
        </div>
      )}

      {/* Balance history chart */}
      {accounts.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#eeeef8' }}>
              Historial de saldos
            </h2>
            <button
              onClick={() => setShowHistory(v => !v)}
              style={{
                fontSize: '12px', color: '#8b5cf6',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {showHistory ? 'Ocultar ▲' : 'Ver gráfico ▼'}
            </button>
          </div>

          {showHistory && (
            <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', padding: '20px' }}>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
                <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18183a" />
                  <XAxis
                    dataKey="label"
                    type="category"
                    allowDuplicatedCategory={false}
                    stroke="#6b6b9e"
                    tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
                  />
                  <YAxis
                    stroke="#6b6b9e"
                    tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
                    tickFormatter={v => `${v >= 0 ? '' : '-'}${Math.abs(v)}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#131328', border: '1px solid #18183a', borderRadius: '8px', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}
                    labelStyle={{ color: '#6b6b9e' }}
                    formatter={(value: any, name: any) => [formatAmount(Number(value), accounts.find(a => a.name === String(name))?.currency ?? 'USD'), String(name)]}
                  />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: '11px', color: '#6b6b9e' }}>{value}</span>}
                  />
                  {accounts.map(acc => {
                    const history = finance.getAccountBalanceHistory(acc.id, 12)
                    return (
                      <Line
                        key={acc.id}
                        data={history}
                        dataKey="balance"
                        name={acc.name}
                        stroke={acc.color}
                        strokeWidth={2}
                        dot={false}
                        type="monotone"
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {accounts.map(acc => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '3px', background: acc.color, borderRadius: '2px' }} />
                    <span style={{ fontSize: '11px', color: '#6b6b9e' }}>{acc.name}</span>
                    <span style={{ fontSize: '11px', color: '#eeeef8', fontWeight: 600 }}>
                      {formatAmount(getBalance(acc.id), acc.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add account modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Agregar cuenta" width="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => f('name', e.target.value)}
              placeholder="Ej: Efectivo USD, Banco Venezuela..."
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '8px' }}>
              Tipo
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ACCOUNT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: t.value as Account['type'] }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: form.type === t.value ? '1px solid #8b5cf6' : '1px solid #18183a',
                    background: form.type === t.value ? '#8b5cf618' : '#131328',
                    color: form.type === t.value ? '#8b5cf6' : '#6b6b9e',
                    fontSize: '12px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    cursor: 'pointer',
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Initial balance + currency */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Balance inicial
            </label>
            <CurrencyInput
              amount={form.initialBalance}
              currency={form.currency}
              onAmountChange={v => f('initialBalance', v)}
              onCurrencyChange={v => setForm(p => ({ ...p, currency: v }))}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '8px' }}>
              Color
            </label>
            <ColorPicker value={form.color} onChange={c => setForm(p => ({ ...p, color: c }))} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                padding: '9px 18px',
                background: '#131328',
                color: '#6b6b9e',
                border: '1px solid #18183a',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              style={{
                padding: '9px 18px',
                background: '#8b5cf6',
                color: '#eeeef8',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer',
              }}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
