// Budget page — redesigned 2026. Summary card + per-category progress list.
import { useState, useMemo } from 'react'
import type { Budget, Transaction, Settings } from '../types'
import { toUSD, currentMonth, formatDisplay, monthLongLabel, shiftMonth } from '../utils/currency'
import { EXPENSE_CATEGORIES } from '../utils/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Topbar } from '../components/layout/Topbar'
import { card, pageTitle, pageSubtitle, fieldLabel, btnPrimary, btnSecondary, pctColor } from '../components/ui/styles'

interface BudgetProps {
  budgets: Budget[]
  transactions: Transaction[]
  settings: Settings
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  onAdd: (budget: Omit<Budget, 'id'>) => void
  onDelete: (id: string) => void
}

export function Budget({ budgets, transactions, settings, displayCurrency, onCurrencyChange, onAdd, onDelete }: BudgetProps) {
  const isMobile = useIsMobile()
  const rate = settings.exchangeRate
  const fmt = (usd: number) => formatDisplay(usd, displayCurrency, rate)

  const [month, setMonth] = useState(currentMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ category: '', limit: '', currency: 'USD' as 'USD' | 'VES' })
  const [hoverDel, setHoverDel] = useState<string | null>(null)

  const allExpenseCategories = useMemo(() => {
    const customs = settings.customExpenseCategories ?? []
    const set = new Set(EXPENSE_CATEGORIES as readonly string[])
    return [...EXPENSE_CATEGORIES, ...customs.filter(c => !set.has(c))]
  }, [settings.customExpenseCategories])

  const monthBudgets = budgets.filter(b => b.month === month)

  const getSpent = (category: string): number =>
    transactions
      .filter(tx => tx.type === 'expense' && tx.category === category && tx.date.startsWith(month))
      .reduce((sum, tx) => sum + toUSD(tx.amount, tx.currency, rate), 0)

  const totalLimit = monthBudgets.reduce((s, b) => s + toUSD(b.limit, b.currency, rate), 0)
  const totalSpent = monthBudgets.reduce((s, b) => s + getSpent(b.category), 0)
  const totalPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0

  const handleAdd = () => {
    const limit = parseFloat(form.limit)
    if (!form.category || isNaN(limit) || limit <= 0) return
    onAdd({ month, category: form.category, limit, currency: form.currency })
    setForm({ category: '', limit: '', currency: 'USD' })
    setModalOpen(false)
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px 40px' : '24px 40px 56px', maxWidth: '1320px', animation: 'cnt-fade .2s ease' }}>
      <Topbar
        pageLabel="Presupuesto"
        displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange}
        showMonth monthLabel={monthLongLabel(month)}
        onPrevMonth={() => setMonth(m => shiftMonth(m, -1))}
        onNextMonth={() => setMonth(m => shiftMonth(m, +1))}
        nextDisabled={month === currentMonth()}
        newLabel="Presupuesto" onNew={() => setModalOpen(true)}
      />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitle}>Presupuesto</h1>
        <p style={pageSubtitle}>Límites mensuales por categoría · {monthLongLabel(month).toLowerCase()}</p>
      </div>

      {monthBudgets.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="Sin presupuesto"
          description={`No hay categorías presupuestadas para ${monthLongLabel(month).toLowerCase()}. Agrega límites para controlar tus gastos.`}
          ctaLabel="+ Agregar categoría"
          onCta={() => setModalOpen(true)}
        />
      ) : (
        <>
          {/* Summary card */}
          <div style={{ ...card, marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '8px' }}>Gastado este mes</div>
                <span className="font-mono" style={{ fontSize: '28px', fontWeight: 600 }}>{fmt(totalSpent)}</span>
                <span className="font-mono" style={{ fontSize: '14px', color: '#52525b' }}> / {fmt(totalLimit)}</span>
              </div>
              <span className="font-mono" style={{ fontSize: '14px', color: pctColor(totalPct) }}>{totalPct}%</span>
            </div>
            <div style={{ height: '8px', borderRadius: '99px', background: '#161619', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '99px', width: `${Math.min(100, totalPct)}%`, background: pctColor(totalPct), transition: 'width .4s ease' }} />
            </div>
          </div>

          {/* Per-category list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {monthBudgets.map(b => {
              const spent = getSpent(b.category)
              const limitUSD = toUSD(b.limit, b.currency, rate)
              const pct = limitUSD > 0 ? Math.round((spent / limitUSD) * 100) : 0
              const remaining = Math.max(0, limitUSD - spent)
              return (
                <div key={b.id} onMouseEnter={() => setHoverDel(b.id)} onMouseLeave={() => setHoverDel(null)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '9px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{b.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="font-mono" style={{ fontSize: '12.5px', color: '#a1a1aa' }}>
                        {fmt(spent)} <span style={{ color: '#52525b' }}>/ {fmt(limitUSD)}</span>
                      </span>
                      <button
                        onClick={() => onDelete(b.id)}
                        title="Eliminar"
                        style={{ color: hoverDel === b.id ? '#f0716a' : '#3a3a40', fontSize: '15px', lineHeight: 1, transition: 'color .12s' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div style={{ height: '6px', borderRadius: '99px', background: '#161619', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', width: `${Math.min(100, pct)}%`, background: pctColor(pct), transition: 'width .4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '7px' }}>
                    <span style={{ fontSize: '11.5px', color: '#52525b' }}>{pct}% usado</span>
                    <span style={{ fontSize: '11.5px', color: '#52525b' }}>{fmt(remaining)} restante</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo presupuesto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={fieldLabel}>Categoría</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="">Seleccionar…</option>
              {allExpenseCategories.filter(c => !monthBudgets.some(b => b.category === c)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Límite mensual</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={form.limit} onChange={e => setForm(p => ({ ...p, limit: e.target.value }))} placeholder="0,00" inputMode="decimal" style={{ flex: 1 }} />
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value as 'USD' | 'VES' }))} style={{ width: '90px' }}>
                <option value="USD">USD</option><option value="VES">VES</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => setModalOpen(false)} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
            <button onClick={handleAdd} style={{ ...btnPrimary, flex: 1 }}>Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
