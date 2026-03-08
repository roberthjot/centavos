// Transactions page — filterable table (desktop) / card list (mobile) with add/edit/delete
import { useState, useMemo } from 'react'
import type { Transaction, Account, Settings } from '../types'
import { formatUSD, formatAmount, toUSD, currentMonth } from '../utils/currency'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_EMOJI } from '../utils/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { TypeSelector } from '../components/ui/TypeSelector'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { TransactionRow } from '../components/ui/TransactionRow'
import { EmptyState } from '../components/ui/EmptyState'

interface TransactionsProps {
  accounts: Account[]
  transactions: Transaction[]
  settings: Settings
  onAdd: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, tx: Partial<Transaction>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  type: 'expense' as Transaction['type'],
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  currency: 'USD' as 'USD' | 'VES',
  category: '',
  accountId: '',
  toAccountId: '',
  note: '',
}

const TYPE_COLOR: Record<Transaction['type'], string> = {
  income: '#10d97a',
  expense: '#f43f5e',
  transfer: '#38bdf8',
}
const TYPE_SIGN: Record<Transaction['type'], string> = {
  income: '+',
  expense: '−',
  transfer: '⇄',
}

export function Transactions({ accounts, transactions, settings, onAdd, onUpdate, onDelete }: TransactionsProps) {
  const isMobile = useIsMobile()
  const [filterMonth, setFilterMonth] = useState(currentMonth())
  const [filterType, setFilterType] = useState<'all' | Transaction['type']>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAccount, setFilterAccount] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Filter transactions
  const filtered = useMemo(() => {
    return [...transactions]
      .filter(tx => {
        if (filterMonth && !tx.date.startsWith(filterMonth)) return false
        if (filterType !== 'all' && tx.type !== filterType) return false
        if (filterCategory && tx.category !== filterCategory) return false
        if (filterAccount && tx.accountId !== filterAccount && tx.toAccountId !== filterAccount) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [transactions, filterMonth, filterType, filterCategory, filterAccount])

  // Balance of filtered (income - expenses)
  const filteredBalance = useMemo(() => {
    return filtered.reduce((sum, tx) => {
      if (tx.type === 'income') return sum + toUSD(tx.amount, tx.currency, settings.exchangeRate)
      if (tx.type === 'expense') return sum - toUSD(tx.amount, tx.currency, settings.exchangeRate)
      return sum
    }, 0)
  }, [filtered, settings.exchangeRate])

  const openNew = () => {
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      accountId: accounts[0]?.id ?? '',
      currency: settings.defaultCurrency,
    })
    setModalOpen(true)
  }

  const openEdit = (tx: Transaction) => {
    setEditingId(tx.id)
    setForm({
      type: tx.type,
      date: tx.date,
      amount: String(tx.amount),
      currency: tx.currency,
      category: tx.category,
      accountId: tx.accountId,
      toAccountId: tx.toAccountId ?? '',
      note: tx.note ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.amount || !form.category || !form.accountId) return
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) return

    const data: Omit<Transaction, 'id' | 'createdAt'> = {
      type: form.type,
      date: form.date,
      amount,
      currency: form.currency,
      category: form.category,
      accountId: form.accountId,
      toAccountId: form.type === 'transfer' ? form.toAccountId || undefined : undefined,
      note: form.note || undefined,
    }
    if (editingId) {
      onUpdate(editingId, data)
    } else {
      onAdd(data)
    }
    setModalOpen(false)
  }

  const f = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const inputLabel = (text: string) => (
    <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
      {text}
    </label>
  )

  const fieldWrap = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ marginBottom: '16px', ...style }}>{children}</div>
  )

  const pad = isMobile ? '16px' : '32px'

  return (
    <div style={{ padding: pad }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '20px' : '24px', color: '#eeeef8' }}>
          Movimientos
        </h1>
        <button
          onClick={openNew}
          style={{
            padding: isMobile ? '9px 14px' : '10px 18px',
            background: '#8b5cf6',
            color: '#eeeef8',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#7c3aed')}
          onMouseLeave={e => (e.currentTarget.style.background = '#8b5cf6')}
        >
          + Nuevo
        </button>
      </div>

      {/* Filter bar — 2-column grid on mobile, auto-width row on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, auto)',
        gap: '10px',
        marginBottom: '14px',
      }}>
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          style={{ width: '100%' }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ width: '100%' }}>
          <option value="all">Todos los tipos</option>
          <option value="income">Ingreso</option>
          <option value="expense">Gasto</option>
          <option value="transfer">Transferencia</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: '100%' }}>
          <option value="">Todas las categorías</option>
          {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} style={{ width: '100%' }}>
          <option value="">Todas las cuentas</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Summary bar */}
      <div style={{
        padding: '10px 16px',
        background: '#0c0c1e',
        border: '1px solid #18183a',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '12px',
        color: '#6b6b9e',
        display: 'flex',
        gap: '16px',
      }}>
        <span>{filtered.length} movimientos</span>
        <span>
          Balance:{' '}
          <span style={{ color: filteredBalance >= 0 ? '#10d97a' : '#f43f5e', fontWeight: 600 }}>
            {formatUSD(filteredBalance)}
          </span>
        </span>
      </div>

      {/* Content: empty state / mobile cards / desktop table */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="💸"
          title="Sin transacciones"
          description="No hay movimientos que coincidan con los filtros seleccionados."
          ctaLabel="+ Nuevo movimiento"
          onCta={openNew}
        />
      ) : isMobile ? (
        /* ── Mobile: card list ─────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(tx => {
            const acc = accounts.find(a => a.id === tx.accountId)
            const toAcc = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null
            const color = TYPE_COLOR[tx.type]
            const sign = TYPE_SIGN[tx.type]
            const emoji = CATEGORY_EMOJI[tx.category] ?? '🔖'
            const [, mm, dd] = tx.date.split('-')
            return (
              <div
                key={tx.id}
                onClick={() => openEdit(tx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  background: '#0c0c1e',
                  border: '1px solid #18183a',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', color: '#eeeef8', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {tx.note || tx.category}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '2px' }}>
                    {acc?.name}{toAcc ? ` → ${toAcc.name}` : ''} · {dd}/{mm}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color }}>
                    {sign}{formatAmount(tx.amount, tx.currency)}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(tx.id) }}
                  style={{ flexShrink: 0, color: '#6b6b9e', fontSize: '18px', padding: '4px 6px', borderRadius: '4px', transition: 'color 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Desktop: full table ───────────────────────────────────────── */
        <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #18183a' }}>
                {['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 16px',
                    textAlign: i === 4 ? 'right' : 'left',
                    fontSize: '11px',
                    color: '#6b6b9e',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  accounts={accounts}
                  onEdit={() => openEdit(tx)}
                  onDelete={() => onDelete(tx.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar movimiento' : 'Nuevo movimiento'}
      >
        <TypeSelector
          value={form.type}
          onChange={v => {
            setForm(prev => ({ ...prev, type: v, category: '' }))
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {fieldWrap(
            <>
              {inputLabel('Fecha')}
              <input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </>,
          )}
          {fieldWrap(
            <>
              {inputLabel('Categoría')}
              <select value={form.category} onChange={e => f('category', e.target.value)}>
                <option value="">Seleccionar...</option>
                {form.type === 'transfer'
                  ? <option value="Transferencia">Transferencia</option>
                  : (form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                      <option key={c} value={c}>{CATEGORY_EMOJI[c] ?? ''} {c}</option>
                    ))}
              </select>
            </>,
          )}
        </div>

        {fieldWrap(
          <>
            {inputLabel('Monto')}
            <CurrencyInput
              amount={form.amount}
              currency={form.currency}
              onAmountChange={v => f('amount', v)}
              onCurrencyChange={v => setForm(prev => ({ ...prev, currency: v }))}
            />
          </>,
        )}

        {fieldWrap(
          <>
            {inputLabel('Cuenta' + (form.type === 'transfer' ? ' origen' : ''))}
            <select value={form.accountId} onChange={e => f('accountId', e.target.value)}>
              <option value="">Seleccionar cuenta...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </>,
        )}

        {form.type === 'transfer' && fieldWrap(
          <>
            {inputLabel('Cuenta destino')}
            <select value={form.toAccountId} onChange={e => f('toAccountId', e.target.value)}>
              <option value="">Seleccionar cuenta...</option>
              {accounts.filter(a => a.id !== form.accountId).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
            </select>
          </>,
        )}

        {fieldWrap(
          <>
            {inputLabel('Nota (opcional)')}
            <input
              type="text"
              value={form.note}
              onChange={e => f('note', e.target.value)}
              placeholder="Descripción..."
            />
          </>,
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={() => setModalOpen(false)}
            style={{
              padding: '9px 18px', background: '#131328', color: '#6b6b9e',
              border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px',
              fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '9px 18px', background: '#8b5cf6', color: '#eeeef8',
              border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
            }}
          >
            {editingId ? 'Guardar' : 'Agregar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
