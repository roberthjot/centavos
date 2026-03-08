// Generic empty state: emoji + title + description + CTA button
interface EmptyStateProps {
  emoji: string
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
}

export function EmptyState({ emoji, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      gap: '12px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '48px', lineHeight: 1 }}>{emoji}</span>
      <h3 style={{
        margin: 0,
        fontSize: '16px',
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        color: '#eeeef8',
      }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: '13px', color: '#6b6b9e', maxWidth: '320px' }}>
        {description}
      </p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop: '8px',
            padding: '10px 20px',
            background: '#8b5cf6',
            color: '#eeeef8',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#7c3aed')}
          onMouseLeave={e => (e.currentTarget.style.background = '#8b5cf6')}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
