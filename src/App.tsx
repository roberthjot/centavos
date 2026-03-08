// CENTAVOS — Main App component
// State-based routing (no react-router), initializes default data on first run
import { useCallback } from 'react'
import type { Account, Transaction, Budget, Goal, Settings, Page } from './types'
import { useStorage } from './hooks/useStorage'
import { useFinance } from './hooks/useFinance'
import { STORAGE_KEYS, DEFAULT_ACCOUNTS, DEFAULT_SETTINGS } from './utils/constants'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Budget as BudgetPage } from './pages/Budget'
import { Goals } from './pages/Goals'
import { Accounts } from './pages/Accounts'
import { Settings as SettingsPage } from './pages/Settings'

/** Generate a unique ID using the browser's crypto API */
const uid = () => crypto.randomUUID()

export default function App() {
  // ---- Persistent state from localStorage ----
  const [activePage, setActivePage] = useStorage<Page>('fin:activePage', 'dashboard')
  const [accounts, setAccounts] = useStorage<Account[]>(STORAGE_KEYS.accounts, DEFAULT_ACCOUNTS)
  const [transactions, setTransactions] = useStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
  const [goals, setGoals] = useStorage<Goal[]>(STORAGE_KEYS.goals, [])
  const [budgets, setBudgets] = useStorage<Budget[]>(STORAGE_KEYS.budgets, [])
  const [settings, setSettings] = useStorage<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)

  // ---- Computed financial values ----
  const finance = useFinance(accounts, transactions, goals, budgets, settings)

  // ---- Account CRUD ----
  const addAccount = useCallback((data: Omit<Account, 'id' | 'createdAt'>) => {
    const account: Account = { ...data, id: uid(), createdAt: new Date().toISOString() }
    setAccounts((prev: Account[]) => [...prev, account])
  }, [setAccounts])

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev: Account[]) => prev.filter(a => a.id !== id))
  }, [setAccounts])

  // ---- Transaction CRUD ----
  const addTransaction = useCallback((data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx: Transaction = { ...data, id: uid(), createdAt: new Date().toISOString() }
    setTransactions((prev: Transaction[]) => [...prev, tx])
  }, [setTransactions])

  const updateTransaction = useCallback((id: string, data: Partial<Transaction>) => {
    setTransactions((prev: Transaction[]) => prev.map(tx => tx.id === id ? { ...tx, ...data } : tx))
  }, [setTransactions])

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev: Transaction[]) => prev.filter(tx => tx.id !== id))
  }, [setTransactions])

  // ---- Goal CRUD ----
  const addGoal = useCallback((data: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal: Goal = { ...data, id: uid(), createdAt: new Date().toISOString() }
    setGoals((prev: Goal[]) => [...prev, goal])
  }, [setGoals])

  const updateGoal = useCallback((id: string, data: Partial<Goal>) => {
    setGoals((prev: Goal[]) => prev.map(g => g.id === id ? { ...g, ...data } : g))
  }, [setGoals])

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev: Goal[]) => prev.filter(g => g.id !== id))
  }, [setGoals])

  // ---- Budget CRUD ----
  const addBudget = useCallback((data: Omit<Budget, 'id'>) => {
    const budget: Budget = { ...data, id: uid() }
    setBudgets((prev: Budget[]) => [...prev, budget])
  }, [setBudgets])

  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev: Budget[]) => prev.filter(b => b.id !== id))
  }, [setBudgets])

  // ---- Settings update ----
  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev: Settings) => ({ ...prev, ...partial }))
  }, [setSettings])

  // ---- Clear all data (reset to defaults) ----
  const clearAllData = useCallback(() => {
    setAccounts(DEFAULT_ACCOUNTS)
    setTransactions([])
    setGoals([])
    setBudgets([])
    setSettings(DEFAULT_SETTINGS)
  }, [setAccounts, setTransactions, setGoals, setBudgets, setSettings])

  // ---- Page renderer ----
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            accounts={accounts}
            transactions={transactions}
            goals={goals}
            budgets={budgets}
            settings={settings}
            onNavigate={setActivePage}
          />
        )
      case 'transactions':
        return (
          <Transactions
            accounts={accounts}
            transactions={transactions}
            settings={settings}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
          />
        )
      case 'budget':
        return (
          <BudgetPage
            budgets={budgets}
            transactions={transactions}
            settings={settings}
            onAdd={addBudget}
            onDelete={deleteBudget}
          />
        )
      case 'goals':
        return (
          <Goals
            goals={goals}
            onAdd={addGoal}
            onUpdate={updateGoal}
            onDelete={deleteGoal}
          />
        )
      case 'accounts':
        return (
          <Accounts
            accounts={accounts}
            settings={settings}
            getBalance={finance.getAccountBalance}
            getTransactionCount={finance.getTransactionCount}
            onAdd={addAccount}
            onDelete={deleteAccount}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            settings={settings}
            accounts={accounts}
            onUpdateSettings={updateSettings}
            onClearData={clearAllData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}
