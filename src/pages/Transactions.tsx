// Transactions page — filterable table (desktop) / card list (mobile) with add/edit/delete
// Features: text search, tag filter, recurring toggle, "apply recurring" from prior month
import { useState, useMemo } from 'react'
import type { Transaction, Account, Settings } from '../types'
import { formatUSD, formatAmount, toUSD, currentMonth } from '../utils/currency'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_EMOJI } from '../utils/constants'

// Merge default categories with user-defined custom ones (deduped, custom appended at end)
function mergeCategories(defaults: readonly string[], customs: string[]): string[] {
  const set = new Set(defaults)
  return [...defaults, ...customs.filter(c => !set.has(c))]
}
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
  type:               'expense' as Transaction['type'],
  date:               new Date().toISOString().slice(0, 10),
  amount:             '',   // used for income / expense
  sent:               '',   // transfer only — amount leaving source account
  received:           '',   // transfer only — amount arriving at destination
  currency:           'USD' as 'USD' | 'VES',
  category:           '',
  accountId:          '',
  toAccountId:        '',
  note:               '',
  isRecurring:        false,
  recurringInterval:  'monthly' as Transaction['recurringInterval'],
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

// Shift YYYY-MM by delta months
function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function Transactions({ accounts, transactions, settings, onAdd, onUpdate, onDelete }: TransactionsProps) {
  const isMobile = useIsMobile()

  // Combine default + custom categories (recomputed whenever settings change)
  const allExpenseCategories = useMemo(
    () => mergeCategories(EXPENSE_CATEGORIES, settings.customExpenseCategories ?? []),
    [settings.customExpenseCategories],
  )
  const allIncomeCategories = useMemo(
    () => mergeCategories(INCOME_CATEGORIES, settings.customIncomeCategories ?? []),
    [settings.customIncomeCategories],
  )

  // ── Filter state ──────────────────────────────────────────
  const [filterMonth,    setFilterMonth]    = useState(currentMonth())
  const [filterType,     setFilterType]     = useState<'all' | Transaction['type']>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAccount,  setFilterAccount]  = useState('')
  const [filterTag,      setFilterTag]      = useState('')
  const [searchText,     setSearchText]     = useState('')

  // ── Modal state ───────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState({ ...EMPTY_FORM })
  const [tagInput,  setTagInput]  = useState('')

  // ── Recurring apply state ─────────────────────────────────
  const [applyingRecurring, setApplyingRecurring] = useState(false)

  // Collect all unique tags from all transactions (for filter dropdown)
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const tx of transactions) {
      if (tx.tags) tx.tags.forEach(t => set.add(t))
    }
    return [...set].sort()
  }, [transactions])

  // Filter transactions
  const filtered = useMemo(() => {
    const q = searchText.toLowerCase()
    return [...transactions]
      .filter(tx => {
        if (filterMonth    && !tx.date.startsWith(filterMonth))                          return false
        if (filterType !== 'all' && tx.type !== filterType)                              return false
        if (filterCategory && tx.category !== filterCategory)                            return false
        if (filterAccount  && tx.accountId !== filterAccount && tx.toAccountId !== filterAccount) return false
        if (filterTag      && !(tx.tags ?? []).includes(filterTag))                      return false
        if (q && !tx.category.toLowerCase().includes(q) &&
            !(tx.note ?? '').toLowerCase().includes(q))                                  return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [transactions, filterMonth, filterType, filterCategory, filterAccount, filterTag, searchText])

  // Balance of filtered (income - expenses)
  const filteredBalance = useMemo(() => {
    return filtered.reduce((sum, tx) => {
      if (tx.type === 'income')  return sum + toUSD(tx.amount, tx.currency, settings.exchangeRate)
      if (tx.type === 'expense') return sum - toUSD(tx.amount, tx.currency, settings.exchangeRate)
      return sum
    }, 0)
  }, [filtered, settings.exchangeRate])

  // Recurring transactions from the previous month that haven't been applied to the current month
  const pendingRecurring = useMemo(() => {
    const prevMonth = shiftMonth(filterMonth, -1)
    const recurringFromPrev = transactions.filter(
      tx => tx.isRecurring && tx.date.startsWith(prevMonth),
    )
    return recurringFromPrev.filter(
      tx => !transactions.some(
        existing =>
          existing.date.startsWith(filterMonth) &&
          existing.category === tx.category &&
          existing.accountId === tx.accountId &&
          existing.isRecurring,
      ),
    )
  }, [transactions, filterMonth])

  const applyRecurring = async () => {
    setApplyingRecurring(true)
    for (const tx of pendingRecurring) {
      const newDate = `${filterMonth}-${tx.date.slice(8)}`
      onAdd({
        type:              tx.type,
        date:              newDate,
        amount:            tx.amount,
        currency:          tx.currency,
        category:          tx.category,
        accountId:         tx.accountId,
        toAccountId:       tx.toAccountId,
        note:              tx.note,
        tags:              tx.tags,
        isRecurring:       true,
        recurringInterval: tx.recurringInterval,
      })
    }
    setApplyingRecurring(false)
  }

  // Keep tags separately since EMPTY_FORM doesn't include them
  const [formTags, setFormTags] = useState<string[]>([])

  const openNewWithTags = () => {
    setFormTags([])
    setTagInput('')
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      accountId: accounts[0]?.id ?? '',
      currency:  settings.defaultCurrency,
    })
    setModalOpen(true)
  }

  const openEditWithTags = (tx: Transaction) => {
    setFormTags(tx.tags ?? [])
    setTagInput('')
    setEditingId(tx.id)
    setForm({
      type:              tx.type,
      date:              tx.date,
      amount:            String(tx.amount),
      sent:              tx.type === 'transfer' ? String(tx.amount) : '',
      received:          tx.type === 'transfer' ? String(tx.amount) : '',
      currency:          tx.currency,
      category:          tx.category,
      accountId:         tx.accountId,
      toAccountId:       tx.toAccountId ?? '',
      note:              tx.note ?? '',
      isRecurring:       tx.isRecurring ?? false,
      recurringInterval: tx.recurringInterval ?? 'monthly',
    })
    setModalOpen(true)
  }

  const addFormTag = () => {
    const clean = tagInput.trim().replace(/,/g, '')
    if (!clean || formTags.includes(clean)) { setTagInput(''); return }
    setFormTags(prev => [...prev, clean])
    setTagInput('')
  }

  const removeFormTag = (tag: string) => setFormTags(prev => prev.filter(t => t !== tag))

  const handleSave = () => {
    const isTransfer = form.type === 'transfer'

    if (isTransfer) {
      const sent     = parseFloat(form.sent)
      const received = parseFloat(form.received)
      if (isNaN(sent) || sent <= 0)          return
      if (isNaN(received) || received <= 0)  return
      if (received > sent)                   return
      if (!form.accountId || !form.toAccountId) return

      const fee = parseFloat((sent - received).toFixed(8))

      const transferData: Omit<Transaction, 'id' | 'createdAt'> = {
        type: 'transfer', date: form.date,
        amount: received, currency: form.currency,
        category: 'Transferencia',
        accountId: form.accountId, toAccountId: form.toAccountId,
        note: form.note || undefined,
        tags: formTags.length > 0 ? formTags : undefined,
        isRecurring: form.isRecurring,
        recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
      }

      if (editingId) {
        onUpdate(editingId, transferData)
      } else {
        onAdd(transferData)
        if (fee > 0) {
          onAdd({
            type: 'expense', date: form.date, amount: fee, currency: form.currency,
            category: 'Comisiones', accountId: form.accountId,
            note: `Comisión: enviado ${sent} → recibido ${received}${form.note ? ` (${form.note})` : ''}`,
          })
        }
      }
    } else {
      if (!form.amount || !form.category || !form.accountId) return
      const amount = parseFloat(form.amount)
      if (isNaN(amount) || amount <= 0) return

      const data: Omit<Transaction, 'id' | 'createdAt'> = {
        type: form.type, date: form.date, amount,
        currency: form.currency, category: form.category,
        accountId: form.accountId,
        note: form.note || undefined,
        tags: formTags.length > 0 ? formTags : undefined,
        isRecurring: form.isRecurring,
        recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
      }
      if (editingId) {
        onUpdate(editingId, data)
      } else {
        onAdd(data)
      }
    }

    setModalOpen(false)
  }

  // Export current filtered view as PDF via browser print
  const exportPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = filtered.map(tx => {
      const acc = accounts.find(a => a.id === tx.accountId)
      const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'
      return `<tr>
        <td>${tx.date}</td>
        <td>${tx.note || tx.category}</td>
        <td>${tx.category}</td>
        <td>${acc?.name ?? ''}</td>
        <td style="text-align:right;color:${TYPE_COLOR[tx.type]}">${sign}${formatAmount(tx.amount, tx.currency)}</td>
        <td>${(tx.tags ?? []).join(', ')}</td>
      </tr>`
    }).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>Movimientos — CENTAVOS</title>
      <style>body{font-family:monospace;padding:24px}table{width:100%;border-collapse:collapse}
      th{background:#eee;padding:8px;text-align:left}td{padding:6px;border-bottom:1px solid #ddd}
      h1{font-size:18px}</style></head><body>
      <h1>🪙 CENTAVOS — Movimientos</h1>
      <p>Período: ${filterMonth || 'todos'} · Generado: ${new Date().toLocaleString('es-VE')}</p>
      <table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Cuenta</th><th>Monto</th><th>Etiquetas</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p><strong>Balance: ${formatUSD(filteredBalance)}</strong> · ${filtered.length} movimientos</p>
      <script>window.print()</script></body></html>`)
    win.document.close()
  }

  const f = (key: keyof typeof form, value: string | boolean) =>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '20px' : '24px', color: '#eeeef8' }}>
          Movimientos
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={exportPDF}
            title="Exportar PDF"
            style={{
              padding: isMobile ? '9px 12px' : '10px 14px',
              background: '#131328', color: '#6b6b9e',
              border: '1px solid #18183a', borderRadius: '8px',
              fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
          >
            {isMobile ? '⬇' : '⬇ PDF'}
          </button>
          <button
            onClick={openNewWithTags}
            style={{
              padding: isMobile ? '9px 14px' : '10px 18px',
              background: '#8b5cf6', color: '#eeeef8',
              border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#7c3aed')}
            onMouseLeave={e => (e.currentTarget.style.background = '#8b5cf6')}
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="🔍 Buscar por descripción o categoría..."
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* Filter bar — 2-column grid on mobile, auto-width row on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, auto)',
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
          {allIncomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
          {allExpenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} style={{ width: '100%' }}>
          <option value="">Todas las cuentas</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ width: '100%' }}>
          <option value="">Todas las etiquetas</option>
          {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
        </select>
      </div>

      {/* Summary bar */}
      <div style={{
        padding: '10px 16px',
        background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '8px',
        marginBottom: pendingRecurring.length > 0 ? '10px' : '16px',
        fontSize: '12px', color: '#6b6b9e',
        display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>{filtered.length} movimientos</span>
          <span>
            Balance:{' '}
            <span style={{ color: filteredBalance >= 0 ? '#10d97a' : '#f43f5e', fontWeight: 600 }}>
              {formatUSD(filteredBalance)}
            </span>
          </span>
        </div>
        {transactions.filter(tx => tx.isRecurring).length > 0 && (
          <span style={{ color: '#8b5cf6' }}>
            🔁 {transactions.filter(tx => tx.isRecurring).length} recurrentes
          </span>
        )}
      </div>

      {/* Apply recurring banner */}
      {pendingRecurring.length > 0 && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: '#8b5cf612', border: '1px solid #8b5cf640', borderRadius: '8px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#eeeef8', fontWeight: 600 }}>
              🔁 {pendingRecurring.length} transacción{pendingRecurring.length > 1 ? 'es' : ''} recurrente{pendingRecurring.length > 1 ? 's' : ''} pendiente{pendingRecurring.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '12px', color: '#6b6b9e', marginTop: '2px' }}>
              {pendingRecurring.map(tx => tx.category).join(' · ')}
            </div>
          </div>
          <button
            onClick={applyRecurring}
            disabled={applyingRecurring}
            style={{
              padding: '8px 16px', background: '#8b5cf6', color: '#eeeef8',
              border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', flexShrink: 0,
            }}
          >
            {applyingRecurring ? 'Aplicando...' : 'Aplicar ahora'}
          </button>
        </div>
      )}

      {/* Content: empty state / mobile cards / desktop table */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="💸"
          title="Sin transacciones"
          description="No hay movimientos que coincidan con los filtros seleccionados."
          ctaLabel="+ Nuevo movimiento"
          onCta={openNewWithTags}
        />
      ) : isMobile ? (
        /* ── Mobile: card list ─────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(tx => {
            const acc   = accounts.find(a => a.id === tx.accountId)
            const toAcc = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null
            const color = TYPE_COLOR[tx.type]
            const sign  = TYPE_SIGN[tx.type]
            const emoji = CATEGORY_EMOJI[tx.category] ?? '🔖'
            const [, mm, dd] = tx.date.split('-')
            return (
              <div
                key={tx.id}
                onClick={() => openEditWithTags(tx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px',
                  background: '#0c0c1e', border: '1px solid #18183a',
                  borderLeft: `3px solid ${color}`, borderRadius: '10px', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', color: '#eeeef8', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {tx.isRecurring && <span style={{ color: '#8b5cf6', marginRight: '4px' }}>🔁</span>}
                    {tx.note || tx.category}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '2px' }}>
                    {acc?.name}{toAcc ? ` → ${toAcc.name}` : ''} · {dd}/{mm}
                    {(tx.tags ?? []).length > 0 && (
                      <span style={{ marginLeft: '6px' }}>
                        {tx.tags!.map(t => `#${t}`).join(' ')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color }}>
                    {sign}{formatAmount(tx.amount, tx.currency)}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(tx.id) }}
                  style={{ flexShrink: 0, color: '#6b6b9e', fontSize: '18px', padding: '4px 6px', borderRadius: '4px' }}
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
                    padding: '10px 16px', textAlign: i === 4 ? 'right' : 'left',
                    fontSize: '11px', color: '#6b6b9e', fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
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
                  onEdit={() => openEditWithTags(tx)}
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
          onChange={v => setForm(prev => ({ ...prev, type: v, category: '' }))}
        />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {fieldWrap(
            <>
              {inputLabel('Fecha')}
              <input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </>,
          )}
          {form.type !== 'transfer' && fieldWrap(
            <>
              {inputLabel('Categoría')}
              <select value={form.category} onChange={e => f('category', e.target.value)}>
                <option value="">Seleccionar...</option>
                {(form.type === 'income' ? allIncomeCategories : allExpenseCategories).map(c => (
                  <option key={c} value={c}>{CATEGORY_EMOJI[c] ?? '🔖'} {c}</option>
                ))}
              </select>
            </>,
          )}
        </div>

        {form.type === 'transfer' ? (
          /* ── Transfer: sent / received / auto fee ───────────────────── */
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                {inputLabel('Enviado (sale de origen)')}
                <CurrencyInput
                  amount={form.sent}
                  currency={form.currency}
                  onAmountChange={v => setForm(p => ({ ...p, sent: v }))}
                  onCurrencyChange={v => setForm(p => ({ ...p, currency: v }))}
                />
              </div>
              <div>
                {inputLabel('Recibido (llega al destino)')}
                <input
                  type="number" value={form.received}
                  onChange={e => setForm(p => ({ ...p, received: e.target.value }))}
                  placeholder="0.00" min="0" step="0.01"
                />
              </div>
            </div>
            {form.sent && form.received && parseFloat(form.sent) > 0 && parseFloat(form.received) > 0 && (() => {
              const fee = parseFloat(form.sent) - parseFloat(form.received)
              if (fee < 0) return (
                <div style={{ padding: '10px 14px', background: '#f43f5e12', border: '1px solid #f43f5e40', borderRadius: '8px', fontSize: '12px', color: '#f43f5e', marginBottom: '16px' }}>
                  ⚠ El monto recibido no puede ser mayor al enviado
                </div>
              )
              if (fee === 0) return (
                <div style={{ padding: '10px 14px', background: '#10d97a12', border: '1px solid #10d97a30', borderRadius: '8px', fontSize: '12px', color: '#10d97a', marginBottom: '16px' }}>
                  ✓ Sin comisión — transferencia exacta
                </div>
              )
              return (
                <div style={{ padding: '10px 14px', background: '#f59e0b12', border: '1px solid #f59e0b40', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b6b9e' }}>🏦 Comisión calculada automáticamente:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px' }}>
                    -{fee.toFixed(2)} {form.currency}
                  </span>
                </div>
              )
            })()}
          </>
        ) : (
          fieldWrap(
            <>
              {inputLabel('Monto')}
              <CurrencyInput
                amount={form.amount}
                currency={form.currency}
                onAmountChange={v => f('amount', v)}
                onCurrencyChange={v => setForm(prev => ({ ...prev, currency: v }))}
              />
            </>,
          )
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
              type="text" value={form.note}
              onChange={e => f('note', e.target.value)}
              placeholder="Descripción..."
            />
          </>,
        )}

        {/* Tags input */}
        {fieldWrap(
          <>
            {inputLabel('Etiquetas (opcional)')}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFormTag() } }}
                placeholder="cliente, proyecto, etc."
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={addFormTag}
                style={{
                  padding: '8px 12px', background: '#131328', color: '#8b5cf6',
                  border: '1px solid #8b5cf640', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
                }}
              >
                +
              </button>
            </div>
            {formTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formTags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 8px', background: '#8b5cf618',
                      border: '1px solid #8b5cf640', borderRadius: '20px',
                      fontSize: '12px', color: '#8b5cf6',
                    }}
                  >
                    #{tag}
                    <button
                      onClick={() => removeFormTag(tag)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b5cf6', padding: '0', lineHeight: 1, fontSize: '14px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>,
        )}

        {/* Recurring toggle */}
        <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#131328', border: '1px solid #18183a', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={e => f('isRecurring', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
            />
            <div>
              <div style={{ fontSize: '13px', color: '#eeeef8' }}>🔁 Transacción recurrente</div>
              <div style={{ fontSize: '11px', color: '#6b6b9e' }}>Se recordará para repetir en meses siguientes</div>
            </div>
          </label>
          {form.isRecurring && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #18183a' }}>
              {inputLabel('Intervalo')}
              <select
                value={form.recurringInterval}
                onChange={e => f('recurringInterval', e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          )}
        </div>

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
