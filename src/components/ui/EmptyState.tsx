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
      <span style={{ fontSize: '40px', lineHeight: 1, opacity: 0.5, filter: 'grayscale(1)' }}>{emoji}</span>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: '13px', color: '#71717a', maxWidth: '320px' }}>
        {description}
      </p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop: '8px', height: '38px', padding: '0 18px',
            background: '#3ecf8e', color: '#09271b',
            borderRadius: '9px', fontSize: '13px', fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#36b87e')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3ecf8e')}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
