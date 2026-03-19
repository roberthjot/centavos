// Debts page — track money you owe and money others owe you
import { useState, useMemo } from 'react'
import type { Debt, Settings } from '../types'
import { formatUSD, formatAmount, toUSD } from '../utils/currency'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { EmptyState } from '../components/ui/EmptyState'

interface DebtsProps {
  debts: Debt[]
  settings: Settings
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
  pending: '#f43f5e',
  partial: '#f59e0b',
  paid:    '#10d97a',
}

export function Debts({ debts, settings, onAdd, onUpdate, onDelete }: DebtsProps) {
  const isMobile = useIsMobile()
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
    const accentColor = debt.type === 'owed_by_me' ? '#f43f5e' : '#10d97a'

    return (
      <div
        key={debt.id}
        style={{
          background: '#0c0c1e', border: '1px solid #18183a',
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: '10px', padding: '16px 18px',
          opacity: debt.status === 'paid' ? 0.5 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#eeeef8', marginBottom: '2px' }}>
              {debt.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b6b9e' }}>
              {debt.type === 'owed_by_me' ? 'Le debo a' : 'Me debe'}: <strong style={{ color: '#a0a0c8' }}>{debt.counterparty}</strong>
              {debt.dueDate && (
                <span style={{ marginLeft: '8px', color: isOverdue ? '#f43f5e' : '#6b6b9e' }}>
                  {isOverdue ? '⚠ ' : '📅 '}{new Date(debt.dueDate + 'T12:00:00').toLocaleDateString('es-VE')}
                </span>
              )}
            </div>
            {debt.note && (
              <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '4px', fontStyle: 'italic' }}>
                {debt.note}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: accentColor, fontFamily: "'IBM Plex Mono', monospace" }}>
              {formatAmount(debt.amount, debt.currency)}
            </div>
            {debt.currency === 'VES' && (
              <div style={{ fontSize: '11px', color: '#6b6b9e' }}>
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
            <div style={{ height: '4px', background: '#18183a', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '4px' }}>
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
                padding: '6px 12px', background: '#10d97a18',
                color: '#10d97a', border: '1px solid #10d97a30',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              ✓ Marcar pagado
            </button>
            <button
              onClick={() => { setPayModalId(debt.id); setPayAmount('') }}
              style={{
                padding: '6px 12px', background: '#f59e0b18',
                color: '#f59e0b', border: '1px solid #f59e0b30',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              + Pago parcial
            </button>
            <button
              onClick={() => openEdit(debt)}
              style={{
                padding: '6px 12px', background: 'none',
                color: '#6b6b9e', border: '1px solid #18183a',
                borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#eeeef8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
            >
              ✏ Editar
            </button>
          </div>
        )}
        {debt.status === 'paid' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#10d97a' }}>✓ Liquidado</span>
          </div>
        )}

        {/* Delete */}
        {deleteConfirm === debt.id ? (
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#f43f5e' }}>¿Eliminar?</span>
            <button onClick={() => { onDelete(debt.id); setDeleteConfirm(null) }}
              style={{ padding: '4px 10px', background: '#f43f5e', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
              Sí
            </button>
            <button onClick={() => setDeleteConfirm(null)}
              style={{ padding: '4px 10px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(debt.id)}
            style={{ marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#6b6b9e', padding: '0' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
          >
            Eliminar
          </button>
        )}
      </div>
    )
  }

  const inputLabel = (text: string) => (
    <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>{text}</label>
  )

  return (
    <div style={{ padding: pad, maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '20px' : '24px', color: '#eeeef8' }}>
          Deudas y Préstamos
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => openNew('owed_to_me')}
            style={{ padding: '9px 14px', background: '#10d97a18', color: '#10d97a', border: '1px solid #10d97a40', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
          >
            + Me deben
          </button>
          <button
            onClick={() => openNew('owed_by_me')}
            style={{ padding: '9px 14px', background: '#f43f5e18', color: '#f43f5e', border: '1px solid #f43f5e40', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
          >
            + Debo
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {debts.filter(d => d.status !== 'paid').length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderLeft: '3px solid #f43f5e', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: '#6b6b9e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Debo (pendiente)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f43f5e', fontFamily: "'IBM Plex Mono', monospace" }}>{formatUSD(summary.oweToOthers)}</div>
          </div>
          <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderLeft: '3px solid #10d97a', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: '#6b6b9e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Me deben (pendiente)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#10d97a', fontFamily: "'IBM Plex Mono', monospace" }}>{formatUSD(summary.owedToMe)}</div>
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
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f43f5e', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔴 Debo ({oweByMe.length})</span>
              <button onClick={() => openNew('owed_by_me')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e', fontSize: '18px', lineHeight: 1 }}>+</button>
            </div>
            {oweByMe.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#6b6b9e', fontStyle: 'italic', padding: '16px 0' }}>Sin deudas propias</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {oweByMe.map(debtCard)}
              </div>
            )}
          </div>

          {/* Column: Others owe me */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#10d97a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🟢 Me deben ({owedToMe.length})</span>
              <button onClick={() => openNew('owed_to_me')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10d97a', fontSize: '18px', lineHeight: 1 }}>+</button>
            </div>
            {owedToMe.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#6b6b9e', fontStyle: 'italic', padding: '16px 0' }}>Nadie te debe</div>
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
                    ? `1px solid ${type === 'owed_by_me' ? '#f43f5e' : '#10d97a'}`
                    : '1px solid #18183a',
                  background: form.type === type
                    ? `${type === 'owed_by_me' ? '#f43f5e' : '#10d97a'}18`
                    : '#131328',
                  color: form.type === type
                    ? (type === 'owed_by_me' ? '#f43f5e' : '#10d97a')
                    : '#6b6b9e',
                  fontSize: '13px', fontWeight: 600,
                  fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
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
              style={{ padding: '9px 18px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              style={{ padding: '9px 18px', background: '#8b5cf6', color: '#eeeef8', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
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
                <div style={{ padding: '12px 14px', background: '#131328', borderRadius: '8px', fontSize: '13px', color: '#6b6b9e' }}>
                  Deuda: <strong style={{ color: '#eeeef8' }}>{debt.name}</strong><br />
                  Restante: <strong style={{ color: '#f59e0b' }}>{formatAmount(remaining, debt.currency)}</strong>
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
                    style={{ padding: '9px 18px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={() => applyPartialPayment(payModalId)}
                    style={{ padding: '9px 18px', background: '#f59e0b', color: '#06060f', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>
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
