// ===== CENTAVOS — Core TypeScript Interfaces =====

export interface Account {
  id: string
  name: string
  type: 'cash' | 'bank' | 'digital' | 'savings' | 'invest'
  currency: 'USD' | 'VES'
  initialBalance: number
  color: string
  createdAt: string
}

export interface Transaction {
  id: string
  date: string          // YYYY-MM-DD
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: 'USD' | 'VES'
  category: string
  accountId: string
  toAccountId?: string  // only for transfers
  note?: string
  tags?: string[]
  createdAt: string
}

export interface Budget {
  id: string
  month: string         // YYYY-MM
  category: string
  limit: number
  currency: 'USD' | 'VES'
}

export interface Goal {
  id: string
  name: string
  emoji: string
  target: number
  saved: number
  currency: 'USD' | 'VES'
  deadline?: string     // YYYY-MM-DD
  note?: string
  createdAt: string
}

export interface Settings {
  exchangeRate: number       // 1 USD = X VES, manually set by user
  defaultCurrency: 'USD' | 'VES'
  defaultAccountId: string
  exchangeRateUpdatedAt?: string
  customExpenseCategories: string[]  // user-defined expense categories
  customIncomeCategories:  string[]  // user-defined income categories
}

// Navigation pages
export type Page = 'dashboard' | 'transactions' | 'budget' | 'goals' | 'accounts' | 'settings'
