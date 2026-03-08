// 8-swatch color picker for account creation
import { ACCOUNT_COLORS } from '../../utils/constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {ACCOUNT_COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={color}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: color,
            border: value === color ? `2px solid #eeeef8` : '2px solid transparent',
            outline: value === color ? `2px solid ${color}` : 'none',
            outlineOffset: '2px',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'outline 0.15s',
          }}
        >
          {value === color && (
            <span style={{ color: '#06060f', fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
