// Number input with an inline USD/VES currency dropdown
interface CurrencyInputProps {
  amount: string
  currency: 'USD' | 'VES'
  onAmountChange: (value: string) => void
  onCurrencyChange: (currency: 'USD' | 'VES') => void
  placeholder?: string
}

export function CurrencyInput({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  placeholder = '0.00',
}: CurrencyInputProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
    }}>
      <input
        type="number"
        value={amount}
        onChange={e => onAmountChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        step="0.01"
        style={{ flex: 1 }}
      />
      <select
        value={currency}
        onChange={e => onCurrencyChange(e.target.value as 'USD' | 'VES')}
        style={{ width: '80px', flexShrink: 0 }}
      >
        <option value="USD">USD</option>
        <option value="VES">VES</option>
      </select>
    </div>
  )
}
