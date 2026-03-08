// Savings goal card with progress, deadline countdown, and fund button
import { useState } from 'react'
import type { Goal } from '../../types'
import { formatAmount } from '../../utils/currency'
import { ProgressBar } from './ProgressBar'
import { Modal } from './Modal'

interface GoalCardProps {
  goal: Goal
  onAddFunds: (goalId: string, amount: number) => void
  onArchive: (goalId: string) => void
}

export function GoalCard({ goal, onAddFunds, onArchive }: GoalCardProps) {
  const [fundModalOpen, setFundModalOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  const pct = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0
  const isComplete = goal.saved >= goal.target

  // Days remaining
  let daysLeft: number | null = null
  let daysColor = '#6b6b9e'
  if (goal.deadline) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dl = new Date(goal.deadline + 'T00:00:00')
    daysLeft = Math.floor((dl.getTime() - now.getTime()) / 86_400_000)
    if (daysLeft < 0) daysColor = '#f43f5e'
    else if (daysLeft < 7) daysColor = '#f59e0b'
  }

  const barColor = isComplete ? '#10d97a' : pct > 70 ? '#f59e0b' : '#8b5cf6'

  const handleAddFunds = () => {
    const n = parseFloat(fundAmount)
    if (!isNaN(n) && n > 0) {
      onAddFunds(goal.id, n)
      setFundAmount('')
      setFundModalOpen(false)
    }
  }

  return (
    <>
      <div style={{
        background: '#0c0c1e',
        border: '1px solid #18183a',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: isComplete ? 0.75 : 1,
      }}>
        {/* Emoji + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '32px', lineHeight: 1 }}>{goal.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600,
              color: '#eeeef8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {goal.name}
            </div>
            {isComplete && <span style={{ fontSize: '11px', color: '#10d97a' }}>✅ Completada</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <ProgressBar value={pct} color={barColor} height={8} />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
            fontSize: '12px',
            color: '#6b6b9e',
          }}>
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

        {/* Actions */}
        {isComplete ? (
          <button
            onClick={() => onArchive(goal.id)}
            style={{
              padding: '8px',
              background: '#131328',
              color: '#6b6b9e',
              border: '1px solid #18183a',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer',
            }}
          >
            Archivar
          </button>
        ) : (
          <button
            onClick={() => setFundModalOpen(true)}
            style={{
              padding: '8px',
              background: '#8b5cf618',
              color: '#8b5cf6',
              border: '1px solid #8b5cf640',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#8b5cf630')}
            onMouseLeave={e => (e.currentTarget.style.background = '#8b5cf618')}
          >
            + Agregar fondos
          </button>
        )}
      </div>

      {/* Add funds modal */}
      <Modal isOpen={fundModalOpen} onClose={() => setFundModalOpen(false)} title={`Agregar fondos — ${goal.name}`} width="360px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Monto ({goal.currency})
            </label>
            <input
              type="number"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddFunds() }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setFundModalOpen(false)}
              style={{
                padding: '8px 16px',
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
              onClick={handleAddFunds}
              style={{
                padding: '8px 16px',
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
              Agregar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
