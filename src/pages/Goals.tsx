// Goals page — redesigned 2026. Grid of savings-goal cards with big % +
// progress bar + "Agregar fondos". Edit/delete preserved as hover controls.
import { useState } from 'react'
import type { Goal, Settings } from '../types'
import { toUSD, formatDisplay } from '../utils/currency'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { Topbar } from '../components/layout/Topbar'
import { card, pageTitle, pageSubtitle, fieldLabel, btnPrimary, btnSecondary } from '../components/ui/styles'

interface GoalsProps {
  goals: Goal[]
  settings: Settings
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  onAdd: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, data: Partial<Goal>) => void
  onDelete: (id: string) => void
}

type ModalMode = null | { kind: 'new' } | { kind: 'funds'; id: string } | { kind: 'edit'; goal: Goal }

export function Goals({ goals, settings, displayCurrency, onCurrencyChange, onAdd, onUpdate, onDelete }: GoalsProps) {
  const isMobile = useIsMobile()
  const rate = settings.exchangeRate
  const fmt = (usd: number) => formatDisplay(usd, displayCurrency, rate)

  const [modal, setModal] = useState<ModalMode>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  // Shared form fields (reused across new/edit/funds)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD')
  const [deadline, setDeadline] = useState('')
  const [note, setNote] = useState('')
  const [funds, setFunds] = useState('')

  const sorted = [...goals].sort((a, b) => {
    const ac = a.saved >= a.target, bc = b.saved >= b.target
    if (ac !== bc) return ac ? 1 : -1
    return b.createdAt.localeCompare(a.createdAt)
  })

  const openNew = () => {
    setName(''); setTarget(''); setSaved(''); setCurrency('USD'); setDeadline(''); setNote('')
    setModal({ kind: 'new' })
  }
  const openEdit = (g: Goal) => {
    setName(g.name); setTarget(String(g.target)); setCurrency(g.currency)
    setDeadline(g.deadline ?? ''); setNote(g.note ?? '')
    setModal({ kind: 'edit', goal: g })
  }
  const openFunds = (id: string) => { setFunds(''); setModal({ kind: 'funds', id }) }

  const submitNew = () => {
    const t = parseFloat(target)
    if (!name || isNaN(t) || t <= 0) return
    onAdd({ name, emoji: '', target: t, saved: parseFloat(saved) || 0, currency, deadline: deadline || undefined, note: note || undefined })
    setModal(null)
  }
  const submitEdit = () => {
    if (modal?.kind !== 'edit') return
    const t = parseFloat(target)
    if (!name || isNaN(t) || t <= 0) return
    onUpdate(modal.goal.id, { name, target: t, currency, deadline: deadline || undefined, note: note || undefined })
    setModal(null)
  }
  const submitFunds = () => {
    if (modal?.kind !== 'funds') return
    const amt = parseFloat(funds)
    const g = goals.find(x => x.id === modal.id)
    if (!g || isNaN(amt) || amt <= 0) return
    onUpdate(modal.id, { saved: Math.min(g.target, g.saved + amt) })
    setModal(null)
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px 40px' : '24px 40px 56px', maxWidth: '1320px', animation: 'cnt-fade .2s ease' }}>
      <Topbar
        pageLabel="Metas"
        displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange}
        newLabel="Meta" onNew={openNew}
      />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitle}>Metas de ahorro</h1>
        <p style={pageSubtitle}>Para dónde va tu dinero a futuro</p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Sin metas de ahorro"
          description="Crea tu primera meta y haz seguimiento de tu progreso hacia objetivos financieros."
          ctaLabel="+ Nueva meta"
          onCta={openNew}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sorted.map(g => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0
            const savedUSD = toUSD(g.saved, g.currency, rate)
            const targetUSD = toUSD(g.target, g.currency, rate)
            const done = g.saved >= g.target
            return (
              <div key={g.id} style={{ ...card, padding: '20px', position: 'relative' }} onMouseEnter={() => setHover(g.id)} onMouseLeave={() => { setHover(null); setConfirmDel(null) }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{g.name}</span>
                  {hover === g.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(g)} title="Editar" style={{ color: '#71717a', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
                        <Icon name="pencil" size={14} />
                      </button>
                      <button onClick={() => confirmDel === g.id ? onDelete(g.id) : setConfirmDel(g.id)} title={confirmDel === g.id ? '¿Confirmar?' : 'Eliminar'} style={{ color: confirmDel === g.id ? '#f0716a' : '#71717a', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#f0716a')} onMouseLeave={e => { if (confirmDel !== g.id) e.currentTarget.style.color = '#71717a' }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono" style={{ fontSize: '11px', color: '#52525b' }}>{g.deadline ? g.deadline.replace(/-/g, '/') : 'Sin fecha'}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="font-mono" style={{ fontSize: '30px', fontWeight: 600, color: done ? '#3ecf8e' : '#3ecf8e' }}>{pct}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '99px', background: '#161619', overflow: 'hidden', marginTop: '12px' }}>
                  <div style={{ height: '100%', borderRadius: '99px', width: `${pct}%`, background: '#3ecf8e', transition: 'width .4s ease' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span className="font-mono" style={{ fontSize: '12.5px' }}>{fmt(savedUSD)}</span>
                  <span className="font-mono" style={{ fontSize: '12px', color: '#52525b' }}>de {fmt(targetUSD)}</span>
                </div>
                <button
                  onClick={() => openFunds(g.id)}
                  disabled={done}
                  style={{
                    width: '100%', marginTop: '16px', height: '36px', borderRadius: '9px',
                    background: '#141417', border: '1px solid #26262b',
                    color: done ? '#52525b' : '#3ecf8e', fontSize: '12.5px', fontWeight: 600,
                    cursor: done ? 'default' : 'pointer',
                  }}
                  onMouseEnter={e => { if (!done) e.currentTarget.style.background = '#1a1a1e' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#141417' }}
                >
                  {done ? '✓ Meta alcanzada' : '+ Agregar fondos'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* New / Edit modal */}
      <Modal isOpen={modal?.kind === 'new' || modal?.kind === 'edit'} onClose={() => setModal(null)} title={modal?.kind === 'edit' ? 'Editar meta' : 'Nueva meta'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={fieldLabel}>Nombre de la meta</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Cámara nueva" />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1.4 }}>
              <label style={fieldLabel}>Objetivo</label>
              <input value={target} onChange={e => setTarget(e.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Moneda</label>
              <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'VES')}>
                <option value="USD">USD</option><option value="VES">VES</option>
              </select>
            </div>
          </div>
          {modal?.kind === 'new' && (
            <div>
              <label style={fieldLabel}>Ya tengo ahorrado (opcional)</label>
              <input value={saved} onChange={e => setSaved(e.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
          )}
          <div>
            <label style={fieldLabel}>Fecha límite (opcional)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div>
            <label style={fieldLabel}>Nota (opcional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Por qué es importante…" />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => setModal(null)} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
            <button onClick={modal?.kind === 'edit' ? submitEdit : submitNew} style={{ ...btnPrimary, flex: 1 }}>Guardar</button>
          </div>
        </div>
      </Modal>

      {/* Add funds modal */}
      <Modal isOpen={modal?.kind === 'funds'} onClose={() => setModal(null)} title="Agregar fondos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={fieldLabel}>Monto a agregar</label>
            <input value={funds} onChange={e => setFunds(e.target.value)} placeholder="0,00" inputMode="decimal" autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => setModal(null)} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
            <button onClick={submitFunds} style={{ ...btnPrimary, flex: 1 }}>Agregar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
