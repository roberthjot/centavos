// Lucide-style line icons (stroke 1.8, round caps) rendered as inline SVG.
// The redesign uses line icons instead of emojis; inlining avoids adding a
// new dependency (lucide-react) while keeping the exact look from the handoff.
import type { CSSProperties, ReactElement } from 'react'

export type IconName =
  | 'dashboard' | 'movimientos' | 'presupuesto' | 'metas' | 'cuentas'
  | 'deudas' | 'anual' | 'configuracion'
  | 'plus' | 'chevronLeft' | 'chevronRight' | 'logout'
  | 'arrowUp' | 'download' | 'upload' | 'trash'

interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  style?: CSSProperties
}

// Each entry returns the inner SVG markup (paths/shapes).
const PATHS: Record<IconName, ReactElement> = {
  dashboard: <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
  movimientos: <><path d="M3 12h18" /><path d="m15 6 6 6-6 6" /><path d="m9 18-6-6 6-6" /></>,
  presupuesto: <><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="13" y="7" width="3" height="10" rx="1" /></>,
  metas: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>,
  cuentas: <><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></>,
  deudas: <><path d="M11 17 5.5 11.5a2.5 2.5 0 0 1 3.5-3.5l.5.5.5-.5a2.5 2.5 0 0 1 3.5 3.5L13 14" /><path d="m13 14 4 4 4-4-2.5-2.5" /></>,
  anual: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  configuracion: <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  chevronLeft: <><path d="m15 18-6-6 6-6" /></>,
  chevronRight: <><path d="m9 18 6-6-6-6" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  arrowUp: <><path d="m6 15 6-6 6 6" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 9l5-5 5 5" /><path d="M12 4v12" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
}

export function Icon({ name, size = 16, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" style={style}
    >
      {PATHS[name]}
    </svg>
  )
}
