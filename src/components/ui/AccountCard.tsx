// Account display card — colored top border, balance, edit and delete
import { useState } from 'react'
import type { Account } from '../../types'
import { formatAmount, formatUSD, toUSD } from '../../utils/currency'
import { ACCOUNT_TYPES } from '../../utils/constants'
import { Modal } from './Modal'
import { ColorPicker } from './ColorPicker'

interface AccountCardProps {
  account:          Account
  balance:          number
  transactionCount: number
  exchangeRate:     number
  onEdit?:   (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => void
  onDelete?: () => void
}

export function AccountCard({ account, balance, transactionCount, exchangeRate, onEdit, onDelete }: AccountCardProps) {
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // ── Edit form ─────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    name:  account.name,
    type:  account.type,
    color: account.color,
  })

  const typeInfo   = ACCOUNT_TYPES.find(t => t.value === account.type)
  const balanceUSD = toUSD(balance, account.currency, exchangeRate)
  const isNegative = balance < 0

  const handleSaveEdit = () => {
    if (!editForm.name) return
    onEdit?.(account.id, { name: editForm.name, type: editForm.type as Account['type'], color: editForm.color })
    setEditOpen(false)
  }

  return (
    <>
      {/* ── Card ───────────────────────────────────────────── */}
      <div style={{ background: '#0c0c1e', border: '1px solid #18183a', borderRadius: '10px', overflow: 'hidden' }}>
        {/* Colored top stripe */}
        <div style={{ height: '4px', background: account.color }} />

        <div style={{ padding: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#eeeef8', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {account.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b6b9e' }}>
                {typeInfo?.emoji} {typeInfo?.label} · {account.currency}
              </div>
            </div>

            {/* Action icons */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginLeft: '8px' }}>
              {/* Edit */}
              <button
                title="Editar cuenta"
                onClick={() => {
                  setEditForm({ name: account.name, type: account.type, color: account.color })
                  setEditOpen(true)
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b9e', fontSize: '13px', padding: '3px 5px', borderRadius: '4px', lineHeight: 1 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
              >
                ✏️
              </button>

              {/* Delete */}
              {onDelete && (
                <button
                  title="Eliminar cuenta"
                  onClick={() => setDeleteOpen(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b9e', fontSize: '13px', padding: '3px 5px', borderRadius: '4px', lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Balance */}
          <div style={{ fontSize: '20px', fontWeight: 600, color: isNegative ? '#f43f5e' : '#eeeef8', marginBottom: '4px' }}>
            {formatAmount(balance, account.currency)}
          </div>

          {account.currency === 'VES' && (
            <div style={{ fontSize: '12px', color: '#6b6b9e' }}>≈ {formatUSD(balanceUSD)}</div>
          )}

          <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '8px' }}>
            {transactionCount} transacciones
          </div>
        </div>
      </div>

      {/* ── Edit account modal ─────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar cuenta" width="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>Nombre</label>
            <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '8px' }}>Tipo</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ACCOUNT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEditForm(p => ({ ...p, type: t.value as Account['type'] }))}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: editForm.type === t.value ? '1px solid #8b5cf6' : '1px solid #18183a', background: editForm.type === t.value ? '#8b5cf618' : '#131328', color: editForm.type === t.value ? '#8b5cf6' : '#6b6b9e', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '8px' }}>Color</label>
            <ColorPicker value={editForm.color} onChange={c => setEditForm(p => ({ ...p, color: c }))} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditOpen(false)} style={{ padding: '9px 18px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSaveEdit} style={{ padding: '9px 18px', background: '#8b5cf6', color: '#eeeef8', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Guardar cambios</button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirmation modal ──────────────────────── */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar cuenta" width="400px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#a0a0c8', lineHeight: 1.6 }}>
            ¿Seguro que quieres eliminar la cuenta <strong style={{ color: '#eeeef8' }}>{account.name}</strong>?
          </p>
          {transactionCount > 0 && (
            <div style={{ padding: '10px 14px', background: '#f59e0b18', border: '1px solid #f59e0b40', borderRadius: '8px', fontSize: '12px', color: '#f59e0b' }}>
              ⚠ Esta cuenta tiene <strong>{transactionCount}</strong> transacciones registradas. Al eliminarla, esas transacciones quedarán sin cuenta asociada.
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteOpen(false)} style={{ padding: '9px 18px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { onDelete?.(); setDeleteOpen(false) }} style={{ padding: '9px 18px', background: '#f43f5e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Eliminar</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
