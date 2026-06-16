// Debts page — track money you owe and money others owe you
import { useState, useMemo } from 'react'
import type { Debt, Settings } from '../types'
import { formatUSD, formatAmount, toUSD, formatDisplay } from '../utils/currency'
import { Topbar } from '../components/layout/Topbar'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

interface DebtsProps {
  debts: Debt[]
  settings: Settings
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  onAdd:    (debt: Omit<Debt, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, data: Partial<Debt>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  name:         '',
  counterparty: '',
  amount:       '',
  currency:     'USD' as 'USD' | 'VES',
  type:         'owed_by_me' as Debt['type'],
  dueDate:      '',
  note:         '',
}

const STATUS_LABEL: Record<Debt['status'], string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid:    'Pagado',
}

const STATUS_COLOR: Record<Debt['status'], string> = {
  pending: '#f0716a',
  partial: '#d9a441',
  paid:    '#3ecf8e',
}

export function Debts({ debts, settings, displayCurrency, onCurrencyChange, onAdd, onUpdate, onDelete }: DebtsProps) {
  const isMobile = useIsMobile()
  const fmt = (usd: number) => formatDisplay(usd, displayCurrency, settings.exchangeRate)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [form,           setForm]           = useState({ ...EMPTY_FORM })
  const [deleteConfirm,  setDeleteConfirm]  = useState<string | null>(null)
  const [payModalId,     setPayModalId]     = useState<string | null>(null)
  const [payAmount,      setPayAmount]      = useState('')

  const f = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // Summary totals
  const summary = useMemo(() => {
    let oweToOthers = 0  // owed_by_me, pending/partial
    let owedToMe    = 0  // owed_to_me, pending/partial
    for (const d of debts) {
      if (d.status === 'paid') continue
      const remaining = toUSD(d.amount - d.paidAmount, d.currency, settings.exchangeRate)
      if (d.type === 'owed_by_me') oweToOthers += remaining
      else owedToMe += remaining
    }
    return { oweToOthers, owedToMe }
  }, [debts, settings.exchangeRate])

  const oweByMe  = debts.filter(d => d.type === 'owed_by_me')
  const owedToMe = debts.filter(d => d.type === 'owed_to_me')

  const openNew = (type: Debt['type']) => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, type, currency: settings.defaultCurrency })
    setModalOpen(true)
  }

  const openEdit = (debt: Debt) => {
    setEditingId(debt.id)
    setForm({
      name:         debt.name,
      counterparty: debt.counterparty,
      amount:       String(debt.amount),
      currency:     debt.currency,
      type:         debt.type,
      dueDate:      debt.dueDate ?? '',
      note:         debt.note ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    const amount = parseFloat(form.amount)
    if (!form.name || !form.counterparty || isNaN(amount) || amount <= 0) return

    const data: Omit<Debt, 'id' | 'createdAt'> = {
      name:         form.name,
      counterparty: form.counterparty,
      amount,
      currency:     form.currency,
      type:         form.type,
      dueDate:      form.dueDate || undefined,
      note:         form.note || undefined,
      status:       'pending',
      paidAmount:   0,
    }

    if (editingId) {
      onUpdate(editingId, { name: data.name, counterparty: data.counterparty, amount: data.amount, currency: data.currency, type: data.type, dueDate: data.dueDate, note: data.note })
    } else {
      onAdd(data)
    }
    setModalOpen(false)
  }

  const markPaid = (id: string) => {
    const debt = debts.find(d => d.id === id)
    if (!debt) return
    onUpdate(id, { status: 'paid', paidAmount: debt.amount })
  }

  const applyPartialPayment = (id: string) => {
    const debt    = debts.find(d => d.id === id)
    const payment = parseFloat(payAmount)
    if (!debt || isNaN(payment) || payment <= 0) return
    const newPaid = Math.min(debt.paidAmount + payment, debt.amount)
    const newStatus: Debt['status'] = newPaid >= debt.amount ? 'paid' : 'partial'
    onUpdate(id, { paidAmount: newPaid, status: newStatus })
    setPayModalId(null)
    setPayAmount('')
  }

  const pad = isMobile ? '16px' : '32px'

  const debtCard = (debt: Debt) => {
    const remaining = debt.amount - debt.paidAmount
    const pct       = debt.amount > 0 ? (debt.paidAmount / debt.amount) * 100 : 0
    const isOverdue = debt.dueDate && debt.status !== 'paid' && debt.dueDate < new Date().toISOString().slice(0, 10)
    const accentColor = debt.type === 'owed_by_me' ? '#f0716a' : '#3ecf8e'

    return (
      <div
        key={debt.id}
        style={{
          background: '#0e0e10', border: '1px solid #1c1c1f',
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: '10px', padding: '16px 18px',
          opacity: debt.status === 'paid' ? 0.5 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '2px' }}>
              {debt.name}
            </div>
            <div style={{ fontSize: '12px', color: '#71717a' }}>
              {debt.type === 'owed_by_me' ? 'Le debo a' : 'Me debe'}: <strong style={{ color: '#a1a1aa' }}>{debt.counterparty}</strong>
              {debt.dueDate && (
                <span style={{ marginLeft: '8px', color: isOverdue ? '#f0716a' : '#71717a' }}>
                  {isOverdue ? '⚠ ' : '📅 '}{new Date(debt.dueDate + 'T12:00:00').toLocaleDateString('es-VE')}
                </span>
              )}
            </div>
            {debt.note && (
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', fontStyle: 'italic' }}>
                {debt.note}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}>
              {formatAmount(debt.amount, debt.currency)}
            </div>
            {debt.currency === 'VES' && (
              <div style={{ fontSize: '11px', color: '#71717a' }}>
                ≈ {formatUSD(toUSD(debt.amount, 'VES', settings.exchangeRate))}
              </div>
            )}
            <div style={{ marginTop: '4px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                borderRadius: '12px', background: `${STATUS_COLOR[debt.status]}18`,
                color: STATUS_COLOR[debt.status],
              }}>
                {STATUS_LABEL[debt.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar for partial payments */}
        {debt.paidAmount > 0 && debt.status !== 'paid' && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ height: '4px', background: '#1c1c1f', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#d9a441', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
              Pagado: {formatAmount(debt.paidAmount, debt.currency)} · Restante: {formatAmount(remaining, debt.currency)}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {debt.status !== 'paid' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => markPaid(debt.id)}
              style={{
                padding: '6px 12px', background: '#3ecf8e18',
                color: '#3ecf8e', border: '1px solid #3ecf8e30',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              ✓ Marcar pagado
            </button>
            <button
              onClick={() => { setPayModalId(debt.id); setPayAmount('') }}
              style={{
                padding: '6px 12px', background: '#d9a44118',
                color: '#d9a441', border: '1px solid #d9a44130',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              + Pago parcial
            </button>
            <button
              onClick={() => openEdit(debt)}
              style={{
                padding: '6px 12px', background: 'none',
                color: '#71717a', border: '1px solid #1c1c1f',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
            >
              ✏ Editar
            </button>
          </div>
        )}
        {debt.status === 'paid' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#3ecf8e' }}>✓ Liquidado</span>
          </div>
        )}

        {/* Delete */}
        {deleteConfirm === debt.id ? (
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#f0716a' }}>¿Eliminar?</span>
            <button onClick={() => { onDelete(debt.id); setDeleteConfirm(null) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0716a', color: '#09090b', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Sí, eliminar
            </button>
            <button onClick={() => setDeleteConfirm(null)}
              style={{ padding: '6px 12px', background: '#141417', color: '#71717a', border: '1px solid #1c1c1f', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(debt.id)}
            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'none', border: '1px solid #3a2226', color: '#f0716a', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'background .12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,113,106,.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Icon name="trash" size={13} /> Eliminar
          </button>
        )}
      </div>
    )
  }

  const inputLabel = (text: string) => (
    <label style={{ fontSize: '12px', color: '#71717a', display: 'block', marginBottom: '6px' }}>{text}</label>
  )

  return (
    <div style={{ padding: pad, maxWidth: '900px', animation: 'cnt-fade .2s ease' }}>
      <Topbar pageLabel="Deudas" displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-.02em', color: '#fafafa' }}>
          Deudas y Préstamos
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => openNew('owed_to_me')}
            style={{ padding: '9px 14px', background: '#3ecf8e18', color: '#3ecf8e', border: '1px solid #3ecf8e40', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}
          >
            + Me deben
          </button>
          <button
            onClick={() => openNew('owed_by_me')}
            style={{ padding: '9px 14px', background: '#f0716a18', color: '#f0716a', border: '1px solid #f0716a40', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}
          >
            + Debo
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {debts.filter(d => d.status !== 'paid').length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderLeft: '3px solid #f0716a', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Debo (pendiente)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f0716a', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(summary.oweToOthers)}</div>
          </div>
          <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderLeft: '3px solid #3ecf8e', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Me deben (pendiente)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#3ecf8e', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(summary.owedToMe)}</div>
          </div>
        </div>
      )}

      {debts.length === 0 ? (
        <EmptyState
          emoji="🤝"
          title="Sin deudas registradas"
          description="Registra préstamos o deudas pendientes para hacer seguimiento de los pagos."
          ctaLabel="+ Agregar deuda"
          onCta={() => openNew('owed_by_me')}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
          {/* Column: I owe */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0716a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔴 Debo ({oweByMe.length})</span>
              <button onClick={() => openNew('owed_by_me')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f0716a', fontSize: '18px', lineHeight: 1 }}>+</button>
            </div>
            {oweByMe.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#71717a', fontStyle: 'italic', padding: '16px 0' }}>Sin deudas propias</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {oweByMe.map(debtCard)}
              </div>
            )}
          </div>

          {/* Column: Others owe me */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#3ecf8e', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🟢 Me deben ({owedToMe.length})</span>
              <button onClick={() => openNew('owed_to_me')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3ecf8e', fontSize: '18px', lineHeight: 1 }}>+</button>
            </div>
            {owedToMe.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#71717a', fontStyle: 'italic', padding: '16px 0' }}>Nadie te debe</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {owedToMe.map(debtCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar deuda' : 'Nueva deuda'} width="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(['owed_by_me', 'owed_to_me'] as const).map(type => (
              <button
                key={type}
                onClick={() => f('type', type)}
                style={{
                  padding: '10px', borderRadius: '8px',
                  border: form.type === type
                    ? `1px solid ${type === 'owed_by_me' ? '#f0716a' : '#3ecf8e'}`
                    : '1px solid #1c1c1f',
                  background: form.type === type
                    ? `${type === 'owed_by_me' ? '#f0716a' : '#3ecf8e'}18`
                    : '#141417',
                  color: form.type === type
                    ? (type === 'owed_by_me' ? '#f0716a' : '#3ecf8e')
                    : '#71717a',
                  fontSize: '13px', fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                }}
              >
                {type === 'owed_by_me' ? '🔴 Yo debo' : '🟢 Me deben'}
              </button>
            ))}
          </div>

          <div>
            {inputLabel('Descripción')}
            <input type="text" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Préstamo, deuda por..." />
          </div>
          <div>
            {inputLabel(form.type === 'owed_by_me' ? 'A quién le debo' : 'Quién me debe')}
            <input type="text" value={form.counterparty} onChange={e => f('counterparty', e.target.value)} placeholder="Nombre, empresa..." />
          </div>
          <div>
            {inputLabel('Monto total')}
            <CurrencyInput
              amount={form.amount}
              currency={form.currency}
              onAmountChange={v => f('amount', v)}
              onCurrencyChange={v => setForm(p => ({ ...p, currency: v }))}
            />
          </div>
          <div>
            {inputLabel('Fecha límite (opcional)')}
            <input type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} />
          </div>
          <div>
            {inputLabel('Nota (opcional)')}
            <input type="text" value={form.note} onChange={e => f('note', e.target.value)} placeholder="Detalles adicionales..." />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ padding: '9px 18px', background: '#141417', color: '#71717a', border: '1px solid #1c1c1f', borderRadius: '6px', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              style={{ padding: '9px 18px', background: '#3ecf8e', color: '#09271b', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {editingId ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Partial payment modal */}
      {payModalId && (
        <Modal isOpen={true} onClose={() => setPayModalId(null)} title="Registrar pago parcial" width="360px">
          {(() => {
            const debt = debts.find(d => d.id === payModalId)
            if (!debt) return null
            const remaining = debt.amount - debt.paidAmount
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 14px', background: '#141417', borderRadius: '8px', fontSize: '13px', color: '#71717a' }}>
                  Deuda: <strong style={{ color: '#fafafa' }}>{debt.name}</strong><br />
                  Restante: <strong style={{ color: '#d9a441' }}>{formatAmount(remaining, debt.currency)}</strong>
                </div>
                <div>
                  {inputLabel('Monto del pago')}
                  <input
                    autoFocus
                    type="number" value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder={`Máx: ${remaining}`}
                    max={remaining} min="0.01" step="0.01"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setPayModalId(null)}
                    style={{ padding: '9px 18px', background: '#141417', color: '#71717a', border: '1px solid #1c1c1f', borderRadius: '6px', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={() => applyPartialPayment(payModalId)}
                    style={{ padding: '9px 18px', background: '#d9a441', color: '#06060f', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}>
                    Registrar pago
                  </button>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}
    </div>
  )
}
