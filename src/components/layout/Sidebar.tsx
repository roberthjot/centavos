// Fixed 210px sidebar with logo and navigation
import type { Page } from '../../types'

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { page: Page; label: string; icon: string }[] = [
  { page: 'dashboard',    label: 'Dashboard',     icon: '▦' },
  { page: 'transactions', label: 'Movimientos',   icon: '⇄' },
  { page: 'budget',       label: 'Presupuesto',   icon: '◫' },
  { page: 'goals',        label: 'Metas',         icon: '◎' },
  { page: 'accounts',     label: 'Cuentas',       icon: '◈' },
  { page: 'settings',     label: 'Config',        icon: '⚙' },
]

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid #18183a',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: '18px',
          color: '#8b5cf6',
          letterSpacing: '0.08em',
        }}>
          CENTAVOS
        </div>
        <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '2px' }}>
          Finanzas Personales
        </div>
      </div>

      {/* Nav items */}
      <div style={{ padding: '12px 10px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.page
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: isActive ? '#8b5cf618' : 'transparent',
                color: isActive ? '#8b5cf6' : '#6b6b9e',
                border: isActive ? '1px solid #8b5cf630' : '1px solid transparent',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                fontFamily: "'IBM Plex Mono', monospace",
                marginBottom: '2px',
                transition: 'all 0.15s',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#131328'
                  e.currentTarget.style.color = '#eeeef8'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6b6b9e'
                }
              }}
            >
              <span style={{ fontSize: '16px', width: '18px', textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px 16px',
        borderTop: '1px solid #18183a',
        fontSize: '10px',
        color: '#6b6b9e',
        flexShrink: 0,
      }}>
        v1.0.0 · USD/VES
      </div>
    </nav>
  )
}
