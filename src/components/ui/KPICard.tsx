// KPI summary card for Dashboard — title, large value, optional subtitle
import type { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: ReactNode
  accentColor: string
}

export function KPICard({ title, value, subtitle, icon, accentColor }: KPICardProps) {
  return (
    <div style={{
      background: '#0c0c1e',
      border: '1px solid #18183a',
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '10px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          width: '32px',
          height: '32px',
          background: `${accentColor}18`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{ fontSize: '12px', color: '#6b6b9e', fontWeight: 500 }}>
          {title}
        </span>
      </div>
      <div style={{
        fontSize: '22px',
        fontWeight: 600,
        color: '#eeeef8',
        letterSpacing: '-0.5px',
        wordBreak: 'break-all',
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#6b6b9e' }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
