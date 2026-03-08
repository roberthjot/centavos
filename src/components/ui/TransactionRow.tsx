// Table row for a single transaction — color-coded by type
import type { Transaction, Account } from '../../types'
import { formatAmount } from '../../utils/currency'
import { CATEGORY_EMOJI } from '../../utils/constants'

interface TransactionRowProps {
  transaction: Transaction
  accounts: Account[]
  onEdit: () => void
  onDelete: () => void
}

const TYPE_COLOR: Record<Transaction['type'], string> = {
  income: '#10d97a',
  expense: '#f43f5e',
  transfer: '#38bdf8',
}

const TYPE_SIGN: Record<Transaction['type'], string> = {
  income: '+',
  expense: '−',
  transfer: '⇄',
}

export function TransactionRow({ transaction: tx, accounts, onEdit, onDelete }: TransactionRowProps) {
  const account = accounts.find(a => a.id === tx.accountId)
  const toAccount = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null
  const color = TYPE_COLOR[tx.type]
  const sign = TYPE_SIGN[tx.type]
  const emoji = CATEGORY_EMOJI[tx.category] ?? '🔖'

  // Format date as DD/MM
  const [, month, day] = tx.date.split('-')
  const dateLabel = `${day}/${month}`

  return (
    <tr
      onClick={onEdit}
      style={{
        borderBottom: '1px solid #18183a',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#131328')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '12px 16px', color: '#6b6b9e', fontSize: '12px', whiteSpace: 'nowrap' }}>
        {dateLabel}
      </td>
      <td style={{ padding: '12px 8px', maxWidth: '180px' }}>
        <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#eeeef8',
          fontSize: '13px',
        }}>
          {tx.note || tx.category}
        </div>
      </td>
      <td style={{ padding: '12px 8px' }}>
        <span style={{
          fontSize: '12px',
          color: '#6b6b9e',
          background: '#131328',
          borderRadius: '4px',
          padding: '2px 6px',
          whiteSpace: 'nowrap',
        }}>
          {emoji} {tx.category}
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#6b6b9e', whiteSpace: 'nowrap' }}>
        {account?.name ?? '—'}
        {toAccount && <span> → {toAccount.name}</span>}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ color, fontWeight: 600, fontSize: '14px' }}>
          {sign} {formatAmount(tx.amount, tx.currency)}
        </span>
      </td>
      <td
        style={{ padding: '12px 16px' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onDelete}
          title="Eliminar"
          style={{
            color: '#6b6b9e',
            fontSize: '16px',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9e')}
        >
          ×
        </button>
      </td>
    </tr>
  )
}
