// Transactions page — redesigned 2026. KPI strip + segmented filters + search +
// table (desktop) / cards (mobile). Keeps search, filters, transfers (with auto
// fee), tags, recurring + apply, PDF export, and add/edit/delete.
import { useState, useMemo } from 'react'
import type { Transaction, Account, Settings } from '../types'
import { formatUSD, formatAmount, formatNative, formatDisplay, toUSD, currentMonth, monthLongLabel, shiftMonth } from '../utils/currency'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_EMOJI } from '../utils/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { TypeSelector } from '../components/ui/TypeSelector'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { Icon } from '../components/ui/Icon'
import { Topbar } from '../components/layout/Topbar'
import { fieldLabel, btnPrimary, btnSecondary, btnGhost } from '../components/ui/styles'

function mergeCategories(defaults: readonly string[], customs: string[]): string[] {
  const set = new Set(defaults)
  return [...defaults, ...customs.filter(c => !set.has(c))]
}

interface TransactionsProps {
  accounts: Account[]
  transactions: Transaction[]
  settings: Settings
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  onAdd: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, tx: Partial<Transaction>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  type: 'expense' as Transaction['type'],
  date: new Date().toISOString().slice(0, 10),
  amount: '', sent: '', received: '',
  currency: 'USD' as 'USD' | 'VES',
  category: '', accountId: '', toAccountId: '', note: '',
  isRecurring: false,
  recurringInterval: 'monthly' as Transaction['recurringInterval'],
}

const TYPE_COLOR: Record<Transaction['type'], string> = { income: '#3ecf8e', expense: '#f0716a', transfer: '#a1a1aa' }
const TYPE_DOT:   Record<Transaction['type'], string> = { income: '#3ecf8e', expense: '#f0716a', transfer: '#52525b' }
const TYPE_SIGN:  Record<Transaction['type'], string> = { income: '+', expense: '−', transfer: '' }

function dayMonth(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${d} ${new Date(2000, m - 1, 1).toLocaleString('es-VE', { month: 'short' }).replace('.', '').slice(0, 3)}`
}

const GRID = 'minmax(0,1.6fr) 150px 150px 70px 110px'

export function Transactions({ accounts, transactions, settings, displayCurrency, onCurrencyChange, onAdd, onUpdate, onDelete }: TransactionsProps) {
  const isMobile = useIsMobile()
  const rate = settings.exchangeRate
  const fmt = (usd: number) => formatDisplay(usd, displayCurrency, rate)

  const allExpenseCategories = useMemo(() => mergeCategories(EXPENSE_CATEGORIES, settings.customExpenseCategories ?? []), [settings.customExpenseCategories])
  const allIncomeCategories = useMemo(() => mergeCategories(INCOME_CATEGORIES, settings.customIncomeCategories ?? []), [settings.customIncomeCategories])

  // ── Filters ──
  const [filterMonth, setFilterMonth] = useState(currentMonth())
  const [filterType, setFilterType] = useState<'all' | Transaction['type']>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [searchText, setSearchText] = useState('')

  // ── Modal ──
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formTags, setFormTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [applyingRecurring, setApplyingRecurring] = useState(false)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const tx of transactions) tx.tags?.forEach(t => set.add(t))
    return [...set].sort()
  }, [transactions])

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase()
    return [...transactions]
      .filter(tx => {
        if (filterMonth && !tx.date.startsWith(filterMonth)) return false
        if (filterType !== 'all' && tx.type !== filterType) return false
        if (filterCategory && tx.category !== filterCategory) return false
        if (filterAccount && tx.accountId !== filterAccount && tx.toAccountId !== filterAccount) return false
        if (filterTag && !(tx.tags ?? []).includes(filterTag)) return false
        if (q && !tx.category.toLowerCase().includes(q) && !(tx.note ?? '').toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [transactions, filterMonth, filterType, filterCategory, filterAccount, filterTag, searchText])

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + toUSD(t.amount, t.currency, rate), 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + toUSD(t.amount, t.currency, rate), 0)

  const pendingRecurring = useMemo(() => {
    const prevMonth = shiftMonth(filterMonth, -1)
    const recurringFromPrev = transactions.filter(tx => tx.isRecurring && tx.date.startsWith(prevMonth))
    return recurringFromPrev.filter(tx => !transactions.some(ex => ex.date.startsWith(filterMonth) && ex.category === tx.category && ex.accountId === tx.accountId && ex.isRecurring))
  }, [transactions, filterMonth])

  const applyRecurring = async () => {
    setApplyingRecurring(true)
    for (const tx of pendingRecurring) {
      onAdd({
        type: tx.type, date: `${filterMonth}-${tx.date.slice(8)}`, amount: tx.amount, currency: tx.currency,
        category: tx.category, accountId: tx.accountId, toAccountId: tx.toAccountId, note: tx.note, tags: tx.tags,
        isRecurring: true, recurringInterval: tx.recurringInterval,
      })
    }
    setApplyingRecurring(false)
  }

  const openNew = () => {
    setFormTags([]); setTagInput(''); setEditingId(null)
    setForm({ ...EMPTY_FORM, accountId: accounts[0]?.id ?? '', currency: displayCurrency, category: '' })
    setModalOpen(true)
  }
  const openEdit = (tx: Transaction) => {
    setFormTags(tx.tags ?? []); setTagInput(''); setEditingId(tx.id)
    setForm({
      type: tx.type, date: tx.date, amount: String(tx.amount),
      sent: tx.type === 'transfer' ? String(tx.amount) : '', received: tx.type === 'transfer' ? String(tx.amount) : '',
      currency: tx.currency, category: tx.category, accountId: tx.accountId, toAccountId: tx.toAccountId ?? '',
      note: tx.note ?? '', isRecurring: tx.isRecurring ?? false, recurringInterval: tx.recurringInterval ?? 'monthly',
    })
    setModalOpen(true)
  }

  const addFormTag = () => {
    const clean = tagInput.trim().replace(/,/g, '')
    if (!clean || formTags.includes(clean)) { setTagInput(''); return }
    setFormTags(prev => [...prev, clean]); setTagInput('')
  }
  const removeFormTag = (tag: string) => setFormTags(prev => prev.filter(t => t !== tag))

  const handleSave = () => {
    const isTransfer = form.type === 'transfer'
    if (isTransfer) {
      const sent = parseFloat(form.sent), received = parseFloat(form.received)
      if (isNaN(sent) || sent <= 0 || isNaN(received) || received <= 0 || received > sent) return
      if (!form.accountId || !form.toAccountId) return
      const fee = parseFloat((sent - received).toFixed(8))
      const transferData: Omit<Transaction, 'id' | 'createdAt'> = {
        type: 'transfer', date: form.date, amount: received, currency: form.currency, category: 'Transferencia',
        accountId: form.accountId, toAccountId: form.toAccountId, note: form.note || undefined,
        tags: formTags.length > 0 ? formTags : undefined, isRecurring: form.isRecurring,
        recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
      }
      if (editingId) onUpdate(editingId, transferData)
      else {
        onAdd(transferData)
        if (fee > 0) onAdd({ type: 'expense', date: form.date, amount: fee, currency: form.currency, category: 'Comisiones', accountId: form.accountId, note: `Comisión: enviado ${sent} → recibido ${received}${form.note ? ` (${form.note})` : ''}` })
      }
    } else {
      if (!form.amount || !form.category || !form.accountId) return
      const amount = parseFloat(form.amount)
      if (isNaN(amount) || amount <= 0) return
      const data: Omit<Transaction, 'id' | 'createdAt'> = {
        type: form.type, date: form.date, amount, currency: form.currency, category: form.category,
        accountId: form.accountId, note: form.note || undefined, tags: formTags.length > 0 ? formTags : undefined,
        isRecurring: form.isRecurring, recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
      }
      if (editingId) onUpdate(editingId, data); else onAdd(data)
    }
    setModalOpen(false)
  }

  const handleDelete = () => { if (editingId) { onDelete(editingId); setModalOpen(false) } }

  const exportPDF = () => {
    const win = window.open('', '_blank'); if (!win) return
    const rows = filtered.map(tx => {
      const acc = accounts.find(a => a.id === tx.accountId)
      const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'
      return `<tr><td>${tx.date}</td><td>${tx.note || tx.category}</td><td>${tx.category}</td><td>${acc?.name ?? ''}</td><td style="text-align:right;color:${TYPE_COLOR[tx.type]}">${sign}${formatAmount(tx.amount, tx.currency)}</td><td>${(tx.tags ?? []).join(', ')}</td></tr>`
    }).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>Movimientos — CENTAVOS</title><style>body{font-family:monospace;padding:24px}table{width:100%;border-collapse:collapse}th{background:#eee;padding:8px;text-align:left}td{padding:6px;border-bottom:1px solid #ddd}h1{font-size:18px}</style></head><body><h1>¢ CENTAVOS — Movimientos</h1><p>Período: ${filterMonth || 'todos'} · Generado: ${new Date().toLocaleString('es-VE')}</p><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Cuenta</th><th>Monto</th><th>Etiquetas</th></tr></thead><tbody>${rows}</tbody></table><p><strong>Balance: ${formatUSD(totalIncome - totalExpense)}</strong> · ${filtered.length} movimientos</p><script>window.print()</script></body></html>`)
    win.document.close()
  }

  const f = (key: keyof typeof form, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }))

  // Segmented filter tab style
  const filterTab = (key: 'all' | Transaction['type'], label: string) => {
    const on = filterType === key
    return (
      <button key={key} onClick={() => setFilterType(key)}
        style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 500, background: on ? '#141417' : 'transparent', color: on ? '#fafafa' : '#71717a' }}>
        {label}
      </button>
    )
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px 40px' : '24px 40px 56px', maxWidth: '1320px', animation: 'cnt-fade .2s ease' }}>
      <Topbar
        pageLabel="Movimientos"
        displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange}
        showMonth monthLabel={monthLongLabel(filterMonth)}
        onPrevMonth={() => setFilterMonth(m => shiftMonth(m, -1))}
        onNextMonth={() => setFilterMonth(m => shiftMonth(m, +1))}
        nextDisabled={filterMonth === currentMonth()}
        newLabel="Nuevo" onNew={openNew}
      />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-.02em' }}>Movimientos</h1>
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#71717a' }}>{filtered.length} movimientos en {monthLongLabel(filterMonth).toLowerCase()}</p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', marginBottom: '30px', gap: isMobile ? '16px' : 0 }}>
        <div style={{ paddingRight: isMobile ? 0 : '24px' }}>
          <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '8px' }}>Ingresos</div>
          <span className="font-mono" style={{ fontSize: '22px', fontWeight: 600, color: '#3ecf8e' }}>{fmt(totalIncome)}</span>
        </div>
        <div style={{ padding: isMobile ? 0 : '0 24px', borderLeft: isMobile ? 'none' : '1px solid #19191d' }}>
          <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '8px' }}>Gastos</div>
          <span className="font-mono" style={{ fontSize: '22px', fontWeight: 600, color: '#f0716a' }}>{fmt(totalExpense)}</span>
        </div>
        <div style={{ padding: isMobile ? 0 : '0 24px', borderLeft: isMobile ? 'none' : '1px solid #19191d' }}>
          <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '8px' }}>Balance</div>
          <span className="font-mono" style={{ fontSize: '22px', fontWeight: 600 }}>{fmt(totalIncome - totalExpense)}</span>
        </div>
      </div>

      {/* Filters: segmented + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#0f0f12', border: '1px solid #1f1f23', borderRadius: '9px', padding: '2px' }}>
          {filterTab('all', 'Todos')}{filterTab('income', 'Ingresos')}{filterTab('expense', 'Gastos')}{filterTab('transfer', 'Transferencias')}
        </div>
        <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Buscar…" style={{ width: isMobile ? '100%' : '220px' }} />
      </div>

      {/* Secondary filters + export */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: 'auto', minWidth: '160px', flex: isMobile ? 1 : 'unset' }}>
          <option value="">Todas las categorías</option>
          {allIncomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
          {allExpenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} style={{ width: 'auto', minWidth: '150px', flex: isMobile ? 1 : 'unset' }}>
          <option value="">Todas las cuentas</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {allTags.length > 0 && (
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ width: 'auto', minWidth: '140px', flex: isMobile ? 1 : 'unset' }}>
            <option value="">Etiquetas</option>
            {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
          </select>
        )}
        <button onClick={exportPDF} title="Exportar PDF" style={btnGhost}>
          <Icon name="download" size={14} /> PDF
        </button>
      </div>

      {/* Recurring banner */}
      {pendingRecurring.length > 0 && (
        <div style={{ padding: '12px 16px', marginBottom: '18px', background: 'rgba(62,207,142,.07)', border: '1px solid rgba(62,207,142,.25)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Icon name="refresh" size={14} style={{ color: '#3ecf8e' }} />
              {pendingRecurring.length} recurrente{pendingRecurring.length > 1 ? 's' : ''} pendiente{pendingRecurring.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>{pendingRecurring.map(tx => tx.category).join(' · ')}</div>
          </div>
          <button onClick={applyRecurring} disabled={applyingRecurring} style={{ ...btnPrimary, height: '34px' }}>
            {applyingRecurring ? 'Aplicando…' : 'Aplicar ahora'}
          </button>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#52525b', fontSize: '13px' }}>No hay movimientos que coincidan.</div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map(tx => {
            const acc = accounts.find(a => a.id === tx.accountId)
            return (
              <div key={tx.id} onClick={() => openEdit(tx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 0', borderBottom: '1px solid #161619', cursor: 'pointer' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: TYPE_DOT[tx.type], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.note || tx.category}</div>
                  <div style={{ fontSize: '11px', color: '#52525b', marginTop: '1px' }}>{tx.category} · {acc?.name ?? '—'} · {dayMonth(tx.date)}</div>
                </div>
                <div className="font-mono" style={{ fontSize: '13px', fontWeight: 500, color: TYPE_COLOR[tx.type], whiteSpace: 'nowrap', flexShrink: 0 }}>{TYPE_SIGN[tx.type]}{formatNative(tx.amount, tx.currency)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '12px', padding: '0 4px 12px', borderBottom: '1px solid #1f1f23', fontSize: '10.5px', color: '#52525b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            <span>Descripción</span><span>Categoría</span><span>Cuenta</span><span>Fecha</span><span style={{ textAlign: 'right' }}>Monto</span>
          </div>
          {filtered.map(tx => {
            const acc = accounts.find(a => a.id === tx.accountId)
            return (
              <div key={tx.id} onClick={() => openEdit(tx)} style={{ display: 'grid', gridTemplateColumns: GRID, gap: '12px', alignItems: 'center', padding: '13px 4px', borderBottom: '1px solid #161619', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0d0d0f')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: TYPE_DOT[tx.type], flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.isRecurring && <Icon name="refresh" size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', color: '#52525b' }} />}
                    {tx.note || tx.category}
                  </span>
                </div>
                <span style={{ fontSize: '12.5px', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.category}</span>
                <span style={{ fontSize: '12.5px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc?.name ?? '—'}</span>
                <span className="font-mono" style={{ fontSize: '12px', color: '#71717a' }}>{dayMonth(tx.date)}</span>
                <span className="font-mono" style={{ fontSize: '13px', fontWeight: 500, color: TYPE_COLOR[tx.type], textAlign: 'right' }}>{TYPE_SIGN[tx.type]}{formatNative(tx.amount, tx.currency)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar movimiento' : 'Nuevo movimiento'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TypeSelector value={form.type} onChange={v => setForm(prev => ({ ...prev, type: v, category: '' }))} />

          {form.type === 'transfer' ? (
            <>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Enviado</label>
                  <CurrencyInput amount={form.sent} currency={form.currency} onAmountChange={v => setForm(p => ({ ...p, sent: v }))} onCurrencyChange={v => setForm(p => ({ ...p, currency: v }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Recibido</label>
                  <input type="number" value={form.received} onChange={e => setForm(p => ({ ...p, received: e.target.value }))} placeholder="0,00" min="0" step="0.01" />
                </div>
              </div>
              {form.sent && form.received && parseFloat(form.sent) > 0 && parseFloat(form.received) > 0 && (() => {
                const fee = parseFloat(form.sent) - parseFloat(form.received)
                if (fee < 0) return <div style={{ padding: '9px 12px', background: 'rgba(240,113,106,.1)', border: '1px solid rgba(240,113,106,.3)', borderRadius: '8px', fontSize: '12px', color: '#f0716a' }}>El monto recibido no puede ser mayor al enviado.</div>
                if (fee === 0) return <div style={{ padding: '9px 12px', background: 'rgba(62,207,142,.1)', border: '1px solid rgba(62,207,142,.25)', borderRadius: '8px', fontSize: '12px', color: '#3ecf8e' }}>✓ Sin comisión — transferencia exacta.</div>
                return <div style={{ padding: '9px 12px', background: 'rgba(217,164,65,.1)', border: '1px solid rgba(217,164,65,.3)', borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#71717a' }}>Comisión automática</span><span className="font-mono" style={{ color: '#d9a441', fontWeight: 600 }}>−{fee.toFixed(2)} {form.currency}</span></div>
              })()}
            </>
          ) : (
            <>
              <div>
                <label style={fieldLabel}>Monto</label>
                <CurrencyInput amount={form.amount} currency={form.currency} onAmountChange={v => f('amount', v)} onCurrencyChange={v => setForm(prev => ({ ...prev, currency: v }))} />
              </div>
              <div>
                <label style={fieldLabel}>Categoría</label>
                <select value={form.category} onChange={e => f('category', e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {(form.type === 'income' ? allIncomeCategories : allExpenseCategories).map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c] ? `${CATEGORY_EMOJI[c]} ` : ''}{c}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label style={fieldLabel}>{form.type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}</label>
            <select value={form.accountId} onChange={e => f('accountId', e.target.value)}>
              <option value="">Seleccionar…</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>

          {form.type === 'transfer' && (
            <div>
              <label style={fieldLabel}>Cuenta destino</label>
              <select value={form.toAccountId} onChange={e => f('toAccountId', e.target.value)}>
                <option value="">Seleccionar…</option>
                {accounts.filter(a => a.id !== form.accountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Fecha</label>
              <input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </div>
            <div style={{ flex: 1.4 }}>
              <label style={fieldLabel}>Nota</label>
              <input value={form.note} onChange={e => f('note', e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={fieldLabel}>Etiquetas</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: formTags.length ? '8px' : 0 }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFormTag() } }} placeholder="cliente, proyecto…" style={{ flex: 1 }} />
              <button type="button" onClick={addFormTag} style={{ width: '40px', borderRadius: '8px', background: '#141417', border: '1px solid #26262b', color: '#3ecf8e', fontSize: '16px' }}>+</button>
            </div>
            {formTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formTags.map(tag => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: '#141417', border: '1px solid #26262b', borderRadius: '99px', fontSize: '12px', color: '#a1a1aa' }}>
                    #{tag}<button onClick={() => removeFormTag(tag)} style={{ color: '#71717a', lineHeight: 1, fontSize: '14px' }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recurring */}
          <div style={{ padding: '12px 14px', background: '#141417', border: '1px solid #26262b', borderRadius: '9px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isRecurring} onChange={e => f('isRecurring', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#3ecf8e' }} />
              <div>
                <div style={{ fontSize: '13px' }}>Transacción recurrente</div>
                <div style={{ fontSize: '11px', color: '#71717a' }}>Se recordará para repetir en meses siguientes</div>
              </div>
            </label>
            {form.isRecurring && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #26262b' }}>
                <label style={fieldLabel}>Intervalo</label>
                <select value={form.recurringInterval} onChange={e => f('recurringInterval', e.target.value)}>
                  <option value="weekly">Semanal</option><option value="monthly">Mensual</option><option value="yearly">Anual</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {editingId && <button onClick={handleDelete} style={{ ...btnSecondary, color: '#f0716a', flexShrink: 0 }}>Eliminar</button>}
            <button onClick={() => setModalOpen(false)} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
            <button onClick={handleSave} style={{ ...btnPrimary, flex: 1 }}>{editingId ? 'Guardar' : 'Agregar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
