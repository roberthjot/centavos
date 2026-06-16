// Shared topbar for the redesigned shell: breadcrumb + global USD/VES toggle +
// optional month navigator + a contextual primary action ("+ Nuevo").
import { Icon } from '../ui/Icon'

interface TopbarProps {
  pageLabel: string
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  // Month navigator (optional — only Dashboard/Movimientos/Presupuesto)
  showMonth?: boolean
  monthLabel?: string
  onPrevMonth?: () => void
  onNextMonth?: () => void
  nextDisabled?: boolean
  // Primary action
  newLabel?: string
  onNew?: () => void
}

// Segmented USD/VES toggle (active tab = filled #26262b).
function CurrencyToggle({ value, onChange }: { value: 'USD' | 'VES'; onChange: (c: 'USD' | 'VES') => void }) {
  const tab = (cur: 'USD' | 'VES') => {
    const on = value === cur
    return (
      <button
        key={cur}
        onClick={() => onChange(cur)}
        style={{
          padding: '5px 13px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
          transition: 'all .15s',
          background: on ? '#26262b' : 'transparent',
          color: on ? '#fafafa' : '#71717a',
        }}
      >
        {cur}
      </button>
    )
  }
  return (
    <div style={{ display: 'flex', background: '#0f0f12', border: '1px solid #1f1f23', borderRadius: '9px', padding: '2px' }}>
      {tab('USD')}{tab('VES')}
    </div>
  )
}

export function Topbar({
  pageLabel, displayCurrency, onCurrencyChange,
  showMonth, monthLabel, onPrevMonth, onNextMonth, nextDisabled,
  newLabel, onNew,
}: TopbarProps) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', flexWrap: 'wrap', marginBottom: '30px',
    }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: '#71717a' }}>
        centavos / <span style={{ color: '#a1a1aa' }}>{pageLabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <CurrencyToggle value={displayCurrency} onChange={onCurrencyChange} />

        {showMonth && (
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f0f12', border: '1px solid #1f1f23', borderRadius: '9px', padding: '2px' }}>
            <button
              onClick={onPrevMonth}
              style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', color: '#71717a' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}
            >
              <Icon name="chevronLeft" size={15} />
            </button>
            <span style={{ minWidth: '92px', textAlign: 'center', fontSize: '12.5px', fontWeight: 500, textTransform: 'capitalize', color: '#d4d4d8' }}>
              {monthLabel}
            </span>
            <button
              onClick={nextDisabled ? undefined : onNextMonth}
              disabled={nextDisabled}
              style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', color: nextDisabled ? '#2a2a2e' : '#71717a', cursor: nextDisabled ? 'default' : 'pointer' }}
              onMouseEnter={e => { if (!nextDisabled) e.currentTarget.style.color = '#fafafa' }}
              onMouseLeave={e => { if (!nextDisabled) e.currentTarget.style.color = '#71717a' }}
            >
              <Icon name="chevronRight" size={15} />
            </button>
          </div>
        )}

        {onNew && (
          <button
            onClick={onNew}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '32px',
              borderRadius: '9px', background: '#fafafa', color: '#09090b', fontSize: '12.5px', fontWeight: 600,
              transition: 'background .12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e4e4e7')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fafafa')}
          >
            <Icon name="plus" size={14} strokeWidth={2.5} />
            {newLabel ?? 'Nuevo'}
          </button>
        )}
      </div>
    </header>
  )
}
