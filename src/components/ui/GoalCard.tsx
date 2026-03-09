// Savings goal card — progress, deadline countdown, add funds, edit and delete
import { useState } from 'react'
import type { Goal } from '../../types'
import { GOAL_EMOJIS } from '../../utils/constants'
import { formatAmount } from '../../utils/currency'
import { ProgressBar } from './ProgressBar'
import { Modal } from './Modal'
import { CurrencyInput } from './CurrencyInput'

interface GoalCardProps {
  goal: Goal
  onAddFunds: (goalId: string, amount: number) => void
  onEdit:     (goalId: string, data: Partial<Goal>) => void
  onDelete:   (goalId: string) => void
}

export function GoalCard({ goal, onAddFunds, onEdit, onDelete }: GoalCardProps) {
  const [fundOpen,   setFundOpen]   = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  // ── Edit form state (pre-filled with current values) ──────
  const [editForm, setEditForm] = useState({
    name:     goal.name,
    emoji:    goal.emoji,
    target:   String(goal.target),
    currency: goal.currency,
    deadline: goal.deadline ?? '',
    note:     goal.note    ?? '',
  })

  const pct        = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0
  const isComplete = goal.saved >= goal.target

  // Days remaining logic
  let daysLeft: number | null = null
  let daysColor = '#6b6b9e'
  if (goal.deadline) {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const dl  = new Date(goal.deadline + 'T00:00:00')
    daysLeft  = Math.floor((dl.getTime() - now.getTime()) / 86_400_000)
    if (daysLeft < 0)      daysColor = '#f43f5e'
    else if (daysLeft < 7) daysColor = '#f59e0b'
  }

  const barColor = isComplete ? '#10d97a' : pct > 70 ? '#f59e0b' : '#8b5cf6'

  // ── Handlers ──────────────────────────────────────────────
  const handleAddFunds = () => {
    const n = parseFloat(fundAmount)
    if (!isNaN(n) && n > 0) {
      onAddFunds(goal.id, n)
      setFundAmount('')
      setFundOpen(false)
    }
  }

  const handleSaveEdit = () => {
    const target = parseFloat(editForm.target)
    if (!editForm.name || isNaN(target) || target <= 0) return
    onEdit(goal.id, {
      name:     editForm.name,
      emoji:    editForm.emoji,
      target,
      currency: editForm.currency as 'USD' | 'VES',
      deadline: editForm.deadline || undefined,
      note:     editForm.note     || undefined,
    })
    setEditOpen(false)
  }

  const ef = (key: keyof typeof editForm, value: string) =>
    setEditForm(prev => ({ ...prev, [key]: value }))


  return (
    <>
      {/* ── Card ───────────────────────────────────────────── */}
      <div style={{
        background:    '#0c0c1e',
        border:        '1px solid #18183a',
        borderRadius:  '10px',
        padding:       '20px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '12px',
        opacity:       isComplete ? 0.8 : 1,
      }}>
        {/* Header: emoji + name + edit/delete icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '32px', lineHeight: 1 }}>{goal.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#eeeef8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {goal.name}
            </div>
            {isComplete && <span style={{ fontSize: '11px', color: '#10d97a' }}>✅ Completada</span>}
          </div>

          {/* Edit button */}
          <button
            title="Editar meta"
            onClick={() => {
              // Refresh form values before opening
              setEditForm({ name: goal.name, emoji: goal.emoji, target: String(goal.target), currency: goal.currency, deadline: goal.deadline ?? '', note: goal.note ?? '' })
              setEditOpen(true)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b9e', fontSize: '14px', padding: '3px 5px', borderRadius: '4px', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
          >
            ✏️
          </button>

          {/* Delete button */}
          <button
            title="Eliminar meta"
            onClick={() => setDeleteOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b9e', fontSize: '14px', padding: '3px 5px', borderRadius: '4px', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
          >
            🗑️
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <ProgressBar value={pct} color={barColor} height={8} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#6b6b9e' }}>
            <span>{formatAmount(goal.saved, goal.currency)}</span>
            <span style={{ color: barColor, fontWeight: 600 }}>{Math.round(pct)}%</span>
            <span>{formatAmount(goal.target, goal.currency)}</span>
          </div>
        </div>

        {/* Deadline */}
        {daysLeft !== null && (
          <div style={{ fontSize: '12px', color: daysColor }}>
            {daysLeft < 0
              ? `⚠ Venció hace ${Math.abs(daysLeft)} días`
              : daysLeft === 0
              ? '⚡ Vence hoy'
              : `${daysLeft} días restantes`}
          </div>
        )}

        {/* Add funds button (only if not complete) */}
        {!isComplete && (
          <button
            onClick={() => setFundOpen(true)}
            style={{ padding: '8px', background: '#8b5cf618', color: '#8b5cf6', border: '1px solid #8b5cf640', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#8b5cf630')}
            onMouseLeave={e => (e.currentTarget.style.background = '#8b5cf618')}
          >
            + Agregar fondos
          </button>
        )}
      </div>

      {/* ── Add funds modal ────────────────────────────────── */}
      <Modal isOpen={fundOpen} onClose={() => setFundOpen(false)} title={`Agregar fondos — ${goal.name}`} width="360px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>Monto ({goal.currency})</label>
            <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleAddFunds() }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setFundOpen(false)} style={{ padding: '8px 16px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleAddFunds} style={{ padding: '8px 16px', background: '#8b5cf6', color: '#eeeef8', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Agregar</button>
          </div>
        </div>
      </Modal>

      {/* ── Edit goal modal ────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar meta" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Emoji picker */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '8px' }}>Ícono</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GOAL_EMOJIS.map(emoji => (
                <button key={emoji} type="button" onClick={() => ef('emoji', emoji)} style={{ width: '40px', height: '40px', fontSize: '20px', borderRadius: '8px', border: editForm.emoji === emoji ? '2px solid #8b5cf6' : '2px solid #18183a', background: editForm.emoji === emoji ? '#8b5cf618' : '#131328', cursor: 'pointer' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>Nombre</label>
            <input type="text" value={editForm.name} onChange={e => ef('name', e.target.value)} />
          </div>

          {/* Target */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>Meta total</label>
            <CurrencyInput amount={editForm.target} currency={editForm.currency as 'USD' | 'VES'} onAmountChange={v => ef('target', v)} onCurrencyChange={v => setEditForm(p => ({ ...p, currency: v }))} />
          </div>

          {/* Deadline */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>Fecha límite (opcional)</label>
            <input type="date" value={editForm.deadline} onChange={e => ef('deadline', e.target.value)} />
          </div>

          {/* Note */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>Nota (opcional)</label>
            <input type="text" value={editForm.note} onChange={e => ef('note', e.target.value)} placeholder="Por qué es importante esta meta..." />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditOpen(false)} style={{ padding: '9px 18px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSaveEdit} style={{ padding: '9px 18px', background: '#8b5cf6', color: '#eeeef8', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Guardar cambios</button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirmation modal ──────────────────────── */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar meta" width="380px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#a0a0c8', lineHeight: 1.6 }}>
            ¿Seguro que quieres eliminar la meta <strong style={{ color: '#eeeef8' }}>{goal.name}</strong>?{' '}
            Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteOpen(false)} style={{ padding: '9px 18px', background: '#131328', color: '#6b6b9e', border: '1px solid #18183a', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { onDelete(goal.id); setDeleteOpen(false) }} style={{ padding: '9px 18px', background: '#f43f5e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>Eliminar</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
