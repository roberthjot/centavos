// Income / Expense / Transfer tab selector for the transaction modal
import type { Transaction } from '../../types'

interface TypeSelectorProps {
  value: Transaction['type']
  onChange: (type: Transaction['type']) => void
}

const TYPES: { value: Transaction['type']; label: string; color: string; bg: string }[] = [
  { value: 'income',   label: 'Ingreso',      color: '#10d97a', bg: '#10d97a18' },
  { value: 'expense',  label: 'Gasto',        color: '#f43f5e', bg: '#f43f5e18' },
  { value: 'transfer', label: 'Transferencia', color: '#38bdf8', bg: '#38bdf818' },
]

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      marginBottom: '20px',
    }}>
      {TYPES.map(t => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          style={{
            padding: '10px 0',
            borderRadius: '8px',
            border: `1px solid ${value === t.value ? t.color : '#18183a'}`,
            background: value === t.value ? t.bg : 'transparent',
            color: value === t.value ? t.color : '#6b6b9e',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: "'IBM Plex Mono', monospace",
            transition: 'all 0.15s',
            cursor: 'pointer',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
