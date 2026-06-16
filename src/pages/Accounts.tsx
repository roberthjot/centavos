// Accounts page — redesigned 2026. Grid of account cards (color stripe, type
// chip, native balance + equivalence). Add/edit/delete + balance history kept.
import { useState } from 'react'
import type { Account, Transaction, Settings } from '../types'
import { toUSD, formatNative, formatDisplay, groupInt } from '../utils/currency'
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '../utils/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { useFinance } from '../hooks/useFinance'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { Topbar } from '../components/layout/Topbar'
import { card, pageTitle, pageSubtitle, fieldLabel, btnPrimary, btnSecondary } from '../components/ui/styles'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AccountsProps {
  accounts: Account[]
  transactions: Transaction[]
  settings: Settings
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  getBalance: (id: string) => number
  getTransactionCount: (id: string) => number
  onAdd: (account: Omit<Account, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
}

const TYPE_LABEL: Record<Account['type'], string> =
  Object.fromEntries(ACCOUNT_TYPES.map(t => [t.value, t.label])) as Record<Account['type'], string>

const EMPTY_FORM = {
  name: '', type: 'cash' as Account['type'], currency: 'USD' as 'USD' | 'VES',
  initialBalance: '', color: ACCOUNT_COLORS[0] as string,
}

export function Accounts({ accounts, transactions, settings, displayCurrency, onCurrencyChange, getBalance, getTransactionCount, onAdd, onUpdate, onDelete }: AccountsProps) {
  const isMobile = useIsMobile()
  const rate = settings.exchangeRate
  const fmt = (usd: number) => formatDisplay(usd, displayCurrency, rate)
  const finance = useFinance(accounts, transactions, [], [], settings)

  const [modal, setModal] = useState<null | 'new' | { edit: Account }>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showHistory, setShowHistory] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const netWorth = accounts.reduce((s, a) => s + toUSD(getBalance(a.id), a.currency, rate), 0)

  const openNew = () => { setForm(EMPTY_FORM); setModal('new') }
  const openEdit = (a: Account) => {
    setForm({ name: a.name, type: a.type, currency: a.currency, initialBalance: String(a.initialBalance), color: a.color })
    setModal({ edit: a })
  }

  const submit = () => {
    if (!form.name) return
    if (modal === 'new') {
      onAdd({ name: form.name, type: form.type, currency: form.currency, initialBalance: parseFloat(form.initialBalance) || 0, color: form.color })
    } else if (modal && 'edit' in modal) {
      onUpdate(modal.edit.id, { name: form.name, type: form.type, color: form.color })
    }
    setModal(null)
  }

  const f = (key: keyof typeof form, value: string) => setForm(p => ({ ...p, [key]: value }))

  return (
    <div style={{ padding: isMobile ? '20px 16px 40px' : '24px 40px 56px', maxWidth: '1320px', animation: 'cnt-fade .2s ease' }}>
      <Topbar
        pageLabel="Cuentas"
        displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange}
        newLabel="Cuenta" onNew={openNew}
      />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitle}>Cuentas</h1>
        <p style={pageSubtitle}>{accounts.length} cuentas · {fmt(netWorth)} en total</p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          emoji="🏦"
          title="Sin cuentas"
          description="Agrega tu primera cuenta para comenzar a registrar tus finanzas."
          ctaLabel="+ Agregar cuenta"
          onCta={openNew}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {accounts.map(a => {
            const bal = getBalance(a.id)
            const alt = a.currency === 'VES' ? `≈ $${groupInt(toUSD(bal, 'VES', rate))}` : `≈ Bs ${groupInt(bal * rate)}`
            return (
              <div key={a.id} style={{ ...card, padding: '20px', position: 'relative' }} onMouseEnter={() => setHover(a.id)} onMouseLeave={() => { setHover(null); setConfirmDel(null) }}>
                <div style={{ height: '3px', width: '34px', borderRadius: '99px', background: a.color, marginBottom: '16px' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#71717a', background: '#141417', padding: '3px 9px', borderRadius: '6px' }}>{TYPE_LABEL[a.type]}</span>
                  {hover === a.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(a)} title="Editar" style={{ color: '#71717a', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
                        <Icon name="pencil" size={14} />
                      </button>
                      <button onClick={() => confirmDel === a.id ? onDelete(a.id) : setConfirmDel(a.id)} title={confirmDel === a.id ? `¿Eliminar? (${getTransactionCount(a.id)} movimientos)` : 'Eliminar'} style={{ color: confirmDel === a.id ? '#f0716a' : '#71717a', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#f0716a')} onMouseLeave={e => { if (confirmDel !== a.id) e.currentTarget.style.color = '#71717a' }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono" style={{ fontSize: '11px', color: '#a1a1aa' }}>{a.currency}</span>
                  )}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>{a.name}</div>
                <div className="font-mono" style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-.02em', color: bal < 0 ? '#f0716a' : '#fafafa' }}>{formatNative(bal, a.currency)}</div>
                <div className="font-mono" style={{ fontSize: '12px', color: '#52525b', marginTop: '6px' }}>{alt}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Balance history (collapsible) */}
      {accounts.length > 0 && (
        <div style={{ marginTop: '34px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Historial de saldos</span>
            <button onClick={() => setShowHistory(v => !v)} style={{ fontSize: '12px', color: '#71717a' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
              {showHistory ? 'Ocultar ▲' : 'Ver gráfico ▼'}
            </button>
          </div>
          {showHistory && (
            <div style={card}>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
                <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#19191d" />
                  <XAxis dataKey="label" type="category" allowDuplicatedCategory={false} stroke="#52525b" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
                  <YAxis stroke="#52525b" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickFormatter={v => `${v >= 0 ? '' : '−'}${Math.abs(v)}`} />
                  <Tooltip contentStyle={{ background: '#0e0e10', border: '1px solid #26262b', borderRadius: '8px', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }} labelStyle={{ color: '#a1a1aa' }}
                    formatter={(value: any, name: any) => [formatNative(Number(value), accounts.find(a => a.name === String(name))?.currency ?? 'USD'), String(name)]} />
                  {accounts.map(a => (
                    <Line key={a.id} data={finance.getAccountBalanceHistory(a.id, 12)} dataKey="balance" name={a.name} stroke={a.color} strokeWidth={2} dot={false} type="monotone" />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                {accounts.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ width: '12px', height: '3px', background: a.color, borderRadius: '2px' }} />
                    <span style={{ fontSize: '11px', color: '#71717a' }}>{a.name}</span>
                    <span className="font-mono" style={{ fontSize: '11px', color: '#fafafa', fontWeight: 500 }}>{formatNative(getBalance(a.id), a.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal isOpen={modal !== null} onClose={() => setModal(null)} title={modal && modal !== 'new' ? 'Editar cuenta' : 'Nueva cuenta'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={fieldLabel}>Nombre</label>
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej. Zelle BofA" />
          </div>
          <div>
            <label style={fieldLabel}>Tipo</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ACCOUNT_TYPES.map(t => {
                const on = form.type === t.value
                return (
                  <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, type: t.value as Account['type'] }))}
                    style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: on ? 'rgba(62,207,142,.16)' : '#141417', border: `1px solid ${on ? '#3ecf8e' : '#26262b'}`, color: on ? '#3ecf8e' : '#71717a' }}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
          {modal === 'new' && (
            <div>
              <label style={fieldLabel}>Balance inicial</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={form.initialBalance} onChange={e => f('initialBalance', e.target.value)} placeholder="0,00" inputMode="decimal" style={{ flex: 1 }} />
                <select value={form.currency} onChange={e => f('currency', e.target.value)} style={{ width: '90px' }}>
                  <option value="USD">USD</option><option value="VES">VES</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label style={fieldLabel}>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ACCOUNT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => f('color', c)}
                  style={{ width: '28px', height: '28px', borderRadius: '7px', background: c, border: form.color === c ? '2px solid #fafafa' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => setModal(null)} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
            <button onClick={submit} style={{ ...btnPrimary, flex: 1 }}>Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
