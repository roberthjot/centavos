// Goals page — savings goal cards with progress and fund tracking
import { useState } from 'react'
import type { Goal } from '../types'
import { GOAL_EMOJIS } from '../utils/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { GoalCard } from '../components/ui/GoalCard'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { EmptyState } from '../components/ui/EmptyState'

interface GoalsProps {
  goals: Goal[]
  onAdd: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, data: Partial<Goal>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  name: '',
  emoji: '💰',
  target: '',
  saved: '',
  currency: 'USD' as 'USD' | 'VES',
  deadline: '',
  note: '',
}

export function Goals({ goals, onAdd, onUpdate, onDelete }: GoalsProps) {
  const isMobile = useIsMobile()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Incomplete goals first, then completed
  const sorted = [...goals].sort((a, b) => {
    const aComplete = a.saved >= a.target
    const bComplete = b.saved >= b.target
    if (aComplete !== bComplete) return aComplete ? 1 : -1
    return b.createdAt.localeCompare(a.createdAt)
  })

  const handleAdd = () => {
    const target = parseFloat(form.target)
    if (!form.name || isNaN(target) || target <= 0) return
    onAdd({
      name: form.name,
      emoji: form.emoji,
      target,
      saved: parseFloat(form.saved) || 0,
      currency: form.currency,
      deadline: form.deadline || undefined,
      note: form.note || undefined,
    })
    setForm(EMPTY_FORM)
    setModalOpen(false)
  }

  const handleAddFunds = (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    onUpdate(goalId, { saved: goal.saved + amount })
  }

  const f = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const pad = isMobile ? '16px' : '32px'

  return (
    <div style={{ padding: pad }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '20px' : '24px', color: '#eeeef8' }}>
          Metas de Ahorro
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
          + Nueva meta
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Sin metas de ahorro"
          description="Crea tu primera meta y haz seguimiento de tu progreso hacia objetivos financieros."
          ctaLabel="+ Nueva meta"
          onCta={() => setModalOpen(true)}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {sorted.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddFunds={handleAddFunds}
              onEdit={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* New goal modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva meta de ahorro" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Emoji picker */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '8px' }}>
              Ícono
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GOAL_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => f('emoji', emoji)}
                  style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    borderRadius: '8px',
                    border: form.emoji === emoji ? '2px solid #8b5cf6' : '2px solid #18183a',
                    background: form.emoji === emoji ? '#8b5cf618' : '#131328',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Nombre de la meta
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => f('name', e.target.value)}
              placeholder="Ej: Fondo de emergencia, Laptop nueva..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Target */}
            <div>
              <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
                Meta total
              </label>
              <CurrencyInput
                amount={form.target}
                currency={form.currency}
                onAmountChange={v => f('target', v)}
                onCurrencyChange={v => setForm(p => ({ ...p, currency: v }))}
              />
            </div>

            {/* Already saved */}
            <div>
              <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
                Ya tengo ahorrado
              </label>
              <input
                type="number"
                value={form.saved}
                onChange={e => f('saved', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => f('deadline', e.target.value)}
            />
          </div>

          {/* Note */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Nota (opcional)
            </label>
            <input
              type="text"
              value={form.note}
              onChange={e => f('note', e.target.value)}
              placeholder="Por qué es importante esta meta..."
            />
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
              Crear meta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
