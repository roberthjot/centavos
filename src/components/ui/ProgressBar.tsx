// Animated progress bar with configurable color
interface ProgressBarProps {
  /** Value from 0 to 100 (capped internally at 100 for visual display) */
  value: number
  color?: string
  height?: number
  showLabel?: boolean
}

export function ProgressBar({
  value,
  color = '#8b5cf6',
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const capped = Math.min(Math.max(value, 0), 100)

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{
          fontSize: '11px',
          color: '#6b6b9e',
          textAlign: 'right',
          marginBottom: '4px',
        }}>
          {Math.round(value)}%
        </div>
      )}
      <div style={{
        background: '#131328',
        borderRadius: '9999px',
        height,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${capped}%`,
          height: '100%',
          background: color,
          borderRadius: '9999px',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}
