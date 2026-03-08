// Account display card with colored top border and balance info
import type { Account } from '../../types'
import { formatAmount, formatUSD, toUSD } from '../../utils/currency'
import { ACCOUNT_TYPES } from '../../utils/constants'

interface AccountCardProps {
  account: Account
  balance: number
  transactionCount: number
  exchangeRate: number
  onDelete?: () => void
}

export function AccountCard({
  account,
  balance,
  transactionCount,
  exchangeRate,
  onDelete,
}: AccountCardProps) {
  const typeInfo = ACCOUNT_TYPES.find(t => t.value === account.type)
  const balanceUSD = toUSD(balance, account.currency, exchangeRate)
  const isNegative = balance < 0

  return (
    <div style={{
      background: '#0c0c1e',
      border: '1px solid #18183a',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      {/* Colored top stripe */}
      <div style={{ height: '4px', background: account.color }} />

      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#eeeef8', marginBottom: '4px' }}>
              {account.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b6b9e' }}>
              {typeInfo?.emoji} {typeInfo?.label} · {account.currency}
            </div>
          </div>
          {onDelete && transactionCount === 0 && (
            <button
              onClick={onDelete}
              title="Eliminar cuenta"
              style={{
                color: '#6b6b9e',
                fontSize: '16px',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
            >
              ×
            </button>
          )}
        </div>

        {/* Balance */}
        <div style={{
          fontSize: '20px',
          fontWeight: 600,
          color: isNegative ? '#f43f5e' : '#eeeef8',
          marginBottom: '4px',
        }}>
          {formatAmount(balance, account.currency)}
        </div>

        {account.currency === 'VES' && (
          <div style={{ fontSize: '12px', color: '#6b6b9e' }}>
            ≈ {formatUSD(balanceUSD)}
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#6b6b9e', marginTop: '8px' }}>
          {transactionCount} transacciones
        </div>
      </div>
    </div>
  )
}
