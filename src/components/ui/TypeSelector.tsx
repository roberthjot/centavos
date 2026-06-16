// Income / Expense / Transfer tab selector for the transaction modal
import type { Transaction } from '../../types'

interface TypeSelectorProps {
  value: Transaction['type']
  onChange: (type: Transaction['type']) => void
}

const TYPES: { value: Transaction['type']; label: string; color: string; bg: string }[] = [
  { value: 'income',   label: 'Ingreso',    color: '#3ecf8e', bg: 'rgba(62,207,142,.16)' },
  { value: 'expense',  label: 'Gasto',      color: '#f0716a', bg: 'rgba(240,113,106,.16)' },
  { value: 'transfer', label: 'Transfer.',  color: '#fafafa', bg: '#26262b' },
]

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      marginBottom: '4px',
    }}>
      {TYPES.map(t => {
        const on = value === t.value
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            style={{
              height: '34px', borderRadius: '8px',
              background: on ? t.bg : '#141417',
              color: on ? t.color : '#71717a',
              fontSize: '12.5px', fontWeight: 600,
              transition: 'all 0.12s',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
