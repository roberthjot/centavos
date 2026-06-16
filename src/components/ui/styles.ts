// Shared inline-style helpers for the 2026 redesign, so pages stay consistent.
// (Inputs/selects are already themed globally in index.css.)
import type { CSSProperties } from 'react'

export const card: CSSProperties = {
  background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '14px', padding: '22px',
}

export const pageTitle: CSSProperties = {
  margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-.02em', color: '#fafafa',
}

export const pageSubtitle: CSSProperties = {
  margin: '6px 0 0', fontSize: '13px', color: '#71717a',
}

export const fieldLabel: CSSProperties = {
  fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block',
}

export const btnPrimary: CSSProperties = {
  height: '38px', padding: '0 16px', borderRadius: '9px',
  background: '#3ecf8e', color: '#09271b', fontSize: '13px', fontWeight: 600,
}

export const btnSecondary: CSSProperties = {
  height: '38px', padding: '0 16px', borderRadius: '9px',
  background: '#161619', color: '#d4d4d8', fontSize: '13px', fontWeight: 500,
}

export const btnGhost: CSSProperties = {
  height: '36px', padding: '0 14px', borderRadius: '9px',
  background: '#141417', border: '1px solid #26262b', color: '#d4d4d8',
  fontSize: '12.5px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '7px',
}

export const btnDanger: CSSProperties = {
  height: '36px', padding: '0 14px', borderRadius: '9px',
  background: 'none', border: '1px solid #3a2226', color: '#f0716a',
  fontSize: '12.5px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '7px',
}

// Budget/progress color by % used.
export function pctColor(pct: number): string {
  return pct >= 95 ? '#f0716a' : pct >= 75 ? '#d9a441' : '#3ecf8e'
}
