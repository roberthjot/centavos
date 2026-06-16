// Fixed 226px sidebar on desktop — horizontal bottom nav bar on mobile.
// Redesign: ¢ wordmark, line-icon nav with a vertical green bar on the active
// item, and a footer with the live exchange rate + user profile + sign-out.
import { useState } from 'react'
import type { Page } from '../../types'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Icon, type IconName } from '../ui/Icon'
import { groupInt } from '../../utils/currency'

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
  exchangeRate: number
  userEmail: string | null
  onSignOut: () => void
}

const NAV_ITEMS: { page: Page; label: string; icon: IconName }[] = [
  { page: 'dashboard',    label: 'Dashboard',     icon: 'dashboard' },
  { page: 'transactions', label: 'Movimientos',   icon: 'movimientos' },
  { page: 'budget',       label: 'Presupuesto',   icon: 'presupuesto' },
  { page: 'goals',        label: 'Metas',         icon: 'metas' },
  { page: 'accounts',     label: 'Cuentas',       icon: 'cuentas' },
  { page: 'debts',        label: 'Deudas',        icon: 'deudas' },
  { page: 'annual',       label: 'Anual',         icon: 'anual' },
  { page: 'settings',     label: 'Configuración', icon: 'configuracion' },
]

// Wordmark: white rounded square with a black "¢" + lowercase "centavos".
function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px', background: '#fafafa',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: '16px', color: '#09090b', lineHeight: 1 }}>¢</span>
      </div>
      <span style={{ fontWeight: 600, fontSize: '16.5px', letterSpacing: '-.02em' }}>centavos</span>
    </div>
  )
}

export function Sidebar({ activePage, onNavigate, exchangeRate, userEmail, onSignOut }: SidebarProps) {
  const isMobile = useIsMobile()
  const [hovered, setHovered] = useState<Page | null>(null)
  const [logoutHover, setLogoutHover] = useState(false)

  // Derive a friendly display name + initial from the email.
  const localPart = (userEmail ?? 'Usuario').split('@')[0]
  const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1)
  const initial = displayName.charAt(0).toUpperCase()

  // ── Mobile: horizontal bottom nav bar ──────────────────────────────────────
  if (isMobile) {
    return (
      <nav className="sidebar">
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.page
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '3px',
                height: '100%', background: 'transparent',
                color: isActive ? '#3ecf8e' : '#52525b',
                borderTop: isActive ? '2px solid #3ecf8e' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Icon name={item.icon} size={18} />
              <span style={{ fontSize: '8px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    )
  }

  // ── Desktop: vertical sidebar ───────────────────────────────────────────────
  return (
    <nav className="sidebar" style={{ padding: '26px 16px' }}>
      <div style={{ padding: '4px 10px 26px' }}>
        <Wordmark />
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.page
          const isHover = hovered === item.page && !isActive
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              onMouseEnter={() => setHovered(item.page)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '9px 12px', borderRadius: '9px', width: '100%', textAlign: 'left',
                fontSize: '13.5px', fontWeight: 500, transition: 'all .12s',
                color: isActive || isHover ? '#fafafa' : '#71717a',
                background: isActive ? '#141417' : isHover ? '#0f0f12' : 'transparent',
              }}
            >
              <span style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: '3px', height: '15px', borderRadius: '99px',
                background: isActive ? '#3ecf8e' : 'transparent',
              }} />
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer — exchange rate */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderTop: '1px solid #19191d',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
          <span style={{ fontSize: '11px', color: '#52525b' }}>Tasa de cambio</span>
          <span className="font-mono" style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '2px' }}>
            Bs {groupInt(exchangeRate)} / USD
          </span>
        </div>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ecf8e' }} />
      </div>

      {/* Footer — profile + sign out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px 0' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', background: '#1f1f23',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a1a1aa', fontWeight: 600, fontSize: '12px', flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '10.5px', color: '#52525b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userEmail ?? 'Cuenta local'}
          </div>
        </div>
        <button
          title="Cerrar sesión"
          onClick={onSignOut}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            width: '28px', height: '28px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: '7px', flexShrink: 0,
            color: logoutHover ? '#f0716a' : '#52525b',
            background: logoutHover ? '#161619' : 'transparent',
            transition: 'all .12s',
          }}
        >
          <Icon name="logout" size={15} />
        </button>
      </div>
    </nav>
  )
}
