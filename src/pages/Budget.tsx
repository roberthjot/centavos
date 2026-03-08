// Budget page — monthly budget cards with progress tracking
import { useState } from 'react'
import type { Budget, Transaction, Settings } from '../types'
import { formatUSD, toUSD, currentMonth } from '../utils/currency'
import { EXPENSE_CATEGORIES } from '../utils/constants'
import { Modal } from '../components/ui/Modal'
import { BudgetCard } from '../components/ui/BudgetCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { CurrencyInput } from '../components/ui/CurrencyInput'

interface BudgetProps {
  budgets: Budget[]
  transactions: Transaction[]
  settings: Settings
  onAdd: (budget: Omit<Budget, 'id'>) => void
  onDelete: (id: string) => void
}

export function Budget({ budgets, transactions, settings, onAdd, onDelete }: BudgetProps) {
  const [month, setMonth] = useState(currentMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    category: '',
    limit: '',
    currency: 'USD' as 'USD' | 'VES',
  })

  const monthBudgets = budgets.filter(b => b.month === month)

  // Compute spent per budget
  const getBudgetSpent = (category: string): number =>
    transactions
      .filter(tx => tx.type === 'expense' && tx.category === category && tx.date.startsWith(month))
      .reduce((sum, tx) => sum + toUSD(tx.amount, tx.currency, settings.exchangeRate), 0)

  const totalLimit = monthBudgets.reduce(
    (sum, b) => sum + toUSD(b.limit, b.currency, settings.exchangeRate), 0,
  )
  const totalSpent = monthBudgets.reduce(
    (sum, b) => sum + getBudgetSpent(b.category), 0,
  )
  const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0

  const handleAdd = () => {
    const limit = parseFloat(form.limit)
    if (!form.category || isNaN(limit) || limit <= 0) return
    onAdd({ month, category: form.category, limit, currency: form.currency })
    setForm({ category: '', limit: '', currency: 'USD' })
    setModalOpen(false)
  }

  const totalBarColor = totalPct >= 100 ? '#f43f5e' : totalPct >= 70 ? '#f59e0b' : '#10d97a'

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', color: '#eeeef8' }}>
          Presupuesto
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ width: '160px' }}
          />
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '10px 18px',
              background: '#8b5cf6',
              color: '#eeeef8',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#7c3aed')}
            onMouseLeave={e => (e.currentTarget.style.background = '#8b5cf6')}
          >
            + Agregar
          </button>
        </div>
      </div>

      {monthBudgets.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="Sin presupuesto"
          description={`No hay categorías presupuestadas para ${month}. Agrega límites para controlar tus gastos.`}
          ctaLabel="+ Agregar categoría"
          onCta={() => setModalOpen(true)}
        />
      ) : (
        <>
          {/* Overall progress */}
          <div style={{
            background: '#0c0c1e',
            border: '1px solid #18183a',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#eeeef8' }}>
                Progreso general
              </span>
              <span style={{ fontSize: '13px', color: '#6b6b9e' }}>
                {formatUSD(totalSpent)} / {formatUSD(totalLimit)}
              </span>
            </div>
            <ProgressBar value={totalPct} color={totalBarColor} height={10} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: '#6b6b9e',
            }}>
              <span>{Math.round(totalPct)}% utilizado</span>
              <span style={{ color: totalPct >= 100 ? '#f43f5e' : '#6b6b9e' }}>
                {totalPct >= 100
                  ? `⚠ Excedido ${formatUSD(totalSpent - totalLimit)}`
                  : `Restante: ${formatUSD(totalLimit - totalSpent)}`}
              </span>
            </div>
          </div>

          {/* Budget grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}>
            {monthBudgets.map(b => (
              <BudgetCard
                key={b.id}
                category={b.category}
                limitUSD={toUSD(b.limit, b.currency, settings.exchangeRate)}
                spent={getBudgetSpent(b.category)}
                onDelete={() => onDelete(b.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Add modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Agregar presupuesto" width="400px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Categoría
            </label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            >
              <option value="">Seleccionar categoría...</option>
              {EXPENSE_CATEGORIES
                .filter(c => !monthBudgets.some(b => b.category === c))
                .map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
              Límite mensual
            </label>
            <CurrencyInput
              amount={form.limit}
              currency={form.currency}
              onAmountChange={v => setForm(p => ({ ...p, limit: v }))}
              onCurrencyChange={v => setForm(p => ({ ...p, currency: v }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                padding: '9px 18px',
                background: '#131328',
                color: '#6b6b9e',
                border: '1px solid #18183a',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              style={{
                padding: '9px 18px',
                background: '#8b5cf6',
                color: '#eeeef8',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer',
              }}
            >
              Agregar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
