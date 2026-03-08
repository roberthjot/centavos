// Budget category card with progress bar and overspend warning
import { formatUSD } from '../../utils/currency'
import { ProgressBar } from './ProgressBar'

interface BudgetCardProps {
  category: string
  limitUSD: number
  spent: number
  onDelete?: () => void
}

export function BudgetCard({ category, limitUSD, spent, onDelete }: BudgetCardProps) {
  const pct = limitUSD > 0 ? (spent / limitUSD) * 100 : 0
  const remaining = limitUSD - spent
  const exceeded = spent > limitUSD

  const barColor = pct >= 100 ? '#f43f5e' : pct >= 70 ? '#f59e0b' : '#10d97a'

  return (
    <div style={{
      background: '#0c0c1e',
      border: `1px solid ${exceeded ? '#f43f5e40' : '#18183a'}`,
      borderRadius: '10px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: '#eeeef8', fontSize: '14px' }}>
          {category}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b6b9e' }}>
            límite: {formatUSD(limitUSD)}
          </span>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{ color: '#6b6b9e', fontSize: '14px', padding: '2px 4px', borderRadius: '4px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Spent vs limit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span style={{ color: barColor, fontWeight: 600 }}>
          {formatUSD(spent)} gastado
        </span>
        <span style={{ color: '#6b6b9e' }}>
          {Math.round(pct)}%
        </span>
      </div>

      {/* Bar */}
      <ProgressBar value={pct} color={barColor} height={8} />

      {/* Status */}
      <div style={{ fontSize: '12px', color: exceeded ? '#f43f5e' : '#6b6b9e' }}>
        {exceeded
          ? `⚠ Excedido ${formatUSD(Math.abs(remaining))}`
          : `Restante: ${formatUSD(remaining)}`}
      </div>
    </div>
  )
}
