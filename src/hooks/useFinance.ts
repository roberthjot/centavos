// ===== CENTAVOS — Computed financial values hook =====

import { useMemo } from 'react'
import type { Account, Transaction, Budget, Goal, Settings } from '../types'
import { toUSD } from '../utils/currency'
import { monthsAgo, formatMonthLabel } from '../utils/currency'

interface MonthlyTotal {
  month: string       // YYYY-MM
  label: string       // "Mar 25"
  income: number      // USD
  expenses: number    // USD
}

interface CategoryTotal {
  category: string
  amount: number      // USD
  color: string
}

interface BalancePoint {
  month: string       // YYYY-MM
  label: string       // "Mar 25"
  balance: number     // in account's native currency
}

// A fixed color palette for chart slices
const PIE_COLORS = [
  '#8b5cf6', '#10d97a', '#f43f5e', '#f59e0b', '#38bdf8',
  '#fb923c', '#a3e635', '#e879f9', '#64748b', '#06b6d4',
  '#ec4899', '#14b8a6', '#84cc16',
]

/**
 * Central hook that computes all derived financial values.
 * Accepts raw data arrays from useStorage and returns computed aggregates.
 */
export function useFinance(
  accounts: Account[],
  transactions: Transaction[],
  goals: Goal[],
  budgets: Budget[],
  settings: Settings,
) {
  // ---- Account balance (computed from transactions) ----
  const accountBalances = useMemo(() => {
    const map = new Map<string, number>()
    for (const acc of accounts) {
      map.set(acc.id, acc.initialBalance)
    }
    for (const tx of transactions) {
      if (tx.type === 'income') {
        map.set(tx.accountId, (map.get(tx.accountId) ?? 0) + tx.amount)
      } else if (tx.type === 'expense') {
        map.set(tx.accountId, (map.get(tx.accountId) ?? 0) - tx.amount)
      } else if (tx.type === 'transfer') {
        map.set(tx.accountId, (map.get(tx.accountId) ?? 0) - tx.amount)
        if (tx.toAccountId) {
          map.set(tx.toAccountId, (map.get(tx.toAccountId) ?? 0) + tx.amount)
        }
      }
    }
    return map
  }, [accounts, transactions])

  /**
   * Get the computed balance for a single account.
   */
  const getAccountBalance = (accountId: string): number => {
    return accountBalances.get(accountId) ?? 0
  }

  // ---- Net worth (all accounts → USD) ----
  const netWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const balance = accountBalances.get(acc.id) ?? 0
      return sum + toUSD(balance, acc.currency, settings.exchangeRate)
    }, 0)
  }, [accounts, accountBalances, settings.exchangeRate])

  // ---- Monthly totals for a given YYYY-MM ----
  const getMonthlyTotals = (month: string) => {
    let income = 0
    let expenses = 0
    for (const tx of transactions) {
      if (!tx.date.startsWith(month)) continue
      const usd = toUSD(tx.amount, tx.currency, settings.exchangeRate)
      if (tx.type === 'income') income += usd
      else if (tx.type === 'expense') expenses += usd
    }
    return { income, expenses }
  }

  // ---- Last 6 months data for AreaChart ----
  const last6MonthsData: MonthlyTotal[] = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = monthsAgo(5 - i)
      const { income, expenses } = getMonthlyTotals(month)
      return { month, label: formatMonthLabel(month), income, expenses }
    })
  }, [transactions, settings.exchangeRate]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Category breakdown for PieChart (expense transactions in a month) ----
  const getCategoryBreakdown = (month: string): CategoryTotal[] => {
    const map = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue
      if (!tx.date.startsWith(month)) continue
      const usd = toUSD(tx.amount, tx.currency, settings.exchangeRate)
      map.set(tx.category, (map.get(tx.category) ?? 0) + usd)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount], i) => ({
        category,
        amount,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
  }

  // ---- Budget spent for a category + month ----
  const getBudgetSpent = (category: string, month: string): number => {
    return transactions
      .filter(tx => tx.type === 'expense' && tx.category === category && tx.date.startsWith(month))
      .reduce((sum, tx) => sum + toUSD(tx.amount, tx.currency, settings.exchangeRate), 0)
  }

  // ---- Transaction count per account ----
  const getTransactionCount = (accountId: string): number => {
    return transactions.filter(
      tx => tx.accountId === accountId || tx.toAccountId === accountId,
    ).length
  }

  // ---- Recent transactions (last N, newest first) ----
  const getRecentTransactions = (limit = 6): Transaction[] => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }

  // ---- Active (incomplete) goals ----
  const activeGoals = useMemo(() => {
    return goals.filter(g => g.saved < g.target)
  }, [goals])

  // ---- Budgets with computed spent amount for a month ----
  const getBudgetsWithProgress = (month: string) => {
    return budgets
      .filter(b => b.month === month)
      .map(b => ({
        ...b,
        spent: getBudgetSpent(b.category, month),
        limitUSD: toUSD(b.limit, b.currency, settings.exchangeRate),
      }))
  }

  /**
   * Balance history for a single account over the last N months.
   * Each point is the running balance at the END of that month.
   * Uses only transactions up to and including that month.
   */
  const getAccountBalanceHistory = (accountId: string, numMonths = 12): BalancePoint[] => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return []

    return Array.from({ length: numMonths }, (_, i) => {
      const month = monthsAgo(numMonths - 1 - i)
      // Include all transactions up to the end of this month
      let balance = account.initialBalance
      for (const tx of transactions) {
        if (tx.date.slice(0, 7) > month) continue  // skip transactions after this month
        if (tx.accountId === accountId) {
          if (tx.type === 'income') balance += tx.amount
          else if (tx.type === 'expense' || tx.type === 'transfer') balance -= tx.amount
        }
        if (tx.toAccountId === accountId && tx.type === 'transfer') {
          balance += tx.amount
        }
      }
      return { month, label: formatMonthLabel(month), balance }
    })
  }

  /**
   * Annual summary: income + expenses for each month of a given year.
   */
  const getAnnualData = (year: number) => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, '0')}`
      const { income, expenses } = getMonthlyTotals(month)
      return {
        month,
        label: new Date(year, i, 1).toLocaleString('es-VE', { month: 'short' }),
        income,
        expenses,
        net: income - expenses,
      }
    })
  }

  return {
    accountBalances,
    getAccountBalance,
    netWorth,
    getMonthlyTotals,
    last6MonthsData,
    getCategoryBreakdown,
    getBudgetSpent,
    getTransactionCount,
    getRecentTransactions,
    activeGoals,
    getBudgetsWithProgress,
    getAccountBalanceHistory,
    getAnnualData,
  }
}
