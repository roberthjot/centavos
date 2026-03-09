// CENTAVOS — Main App component
// Auth via Supabase. All state loaded from DB after login.
import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Account, Transaction, Budget, Goal, Settings, Page } from './types'
import { supabase } from './lib/supabase'
import * as db from './lib/db'
import { useFinance } from './hooks/useFinance'
import { DEFAULT_SETTINGS } from './utils/constants'
import { Sidebar } from './components/layout/Sidebar'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Budget as BudgetPage } from './pages/Budget'
import { Goals } from './pages/Goals'
import { Accounts } from './pages/Accounts'
import { Settings as SettingsPage } from './pages/Settings'

// ── Loading screen ────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh', background: '#080818',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: '28px', color: '#8b5cf6',
      }}>
        CENTAVOS
      </div>
      <div style={{ fontSize: '13px', color: '#6b6b9e' }}>Cargando...</div>
    </div>
  )
}

export default function App() {
  // ── Auth state ────────────────────────────────────────────
  const [user, setUser]       = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── App state ─────────────────────────────────────────────
  const [activePage, setActivePage]     = useState<Page>('dashboard')
  const [accounts, setAccounts]         = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals]               = useState<Goal[]>([])
  const [budgets, setBudgets]           = useState<Budget[]>([])
  const [settings, setSettings]         = useState<Settings>(DEFAULT_SETTINGS)

  // ── Listen for auth changes ───────────────────────────────
  useEffect(() => {
    let resolved = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth] event:', event, '| user:', session?.user?.email ?? null)
      resolved = true
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    // Handle implicit OAuth redirect: Supabase puts #access_token= in the URL hash.
    // We parse it and call setSession() explicitly so the SDK stores the session
    // and fires SIGNED_IN via onAuthStateChange above.
    const hash = window.location.hash
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1))
      const access_token  = params.get('access_token')  ?? ''
      const refresh_token = params.get('refresh_token') ?? ''
      if (access_token) {
        console.log('[auth] found access_token in hash — calling setSession()')
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (error) console.error('[auth] setSession error:', error.message)
          // Clean up the hash so it doesn't stay in the URL bar
          window.history.replaceState(null, '', window.location.pathname)
        })
      }
    }

    // Fallback: if onAuthStateChange never fires within 2 s (race condition),
    // resolve loading state directly via getSession()
    const fallback = setTimeout(async () => {
      if (!resolved) {
        console.log('[auth] fallback triggered')
        const { data: { session } } = await supabase.auth.getSession()
        resolved = true
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallback)
    }
  }, [])

  // ── Load all data when user logs in ───────────────────────
  useEffect(() => {
    if (!user) {
      // Clear state on logout
      setAccounts([])
      setTransactions([])
      setGoals([])
      setBudgets([])
      setSettings(DEFAULT_SETTINGS)
      return
    }
    loadAllData()
  }, [user])

  const loadAllData = async () => {
    const [accs, txs, gls, bgs, sett] = await Promise.all([
      db.getAccounts(),
      db.getTransactions(),
      db.getGoals(),
      db.getBudgets(),
      db.getSettings(),
    ])
    setAccounts(accs)
    setTransactions(txs)
    setGoals(gls)
    setBudgets(bgs)
    if (sett) {
      setSettings(sett)
    } else {
      // First login — create default settings row
      await db.upsertSettings(DEFAULT_SETTINGS)
    }
  }

  // ── Computed financial values ─────────────────────────────
  const finance = useFinance(accounts, transactions, goals, budgets, settings)

  // ── Account CRUD ──────────────────────────────────────────
  const addAccount = useCallback(async (data: Omit<Account, 'id' | 'createdAt'>) => {
    const account = await db.addAccount(data)
    if (account) setAccounts(prev => [...prev, account])
  }, [])

  const updateAccount = useCallback(async (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => {
    await db.updateAccount(id, data)
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
  }, [])

  const deleteAccount = useCallback(async (id: string) => {
    await db.deleteAccount(id)
    setAccounts(prev => prev.filter(a => a.id !== id))
    setTransactions(prev => prev.filter(tx => tx.accountId !== id))
  }, [])

  // ── Transaction CRUD ──────────────────────────────────────
  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx = await db.addTransaction(data)
    if (tx) setTransactions(prev => [tx, ...prev])
  }, [])

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    await db.updateTransaction(id, data)
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...data } : tx))
  }, [])

  const deleteTransaction = useCallback(async (id: string) => {
    await db.deleteTransaction(id)
    setTransactions(prev => prev.filter(tx => tx.id !== id))
  }, [])

  // ── Goal CRUD ─────────────────────────────────────────────
  const addGoal = useCallback(async (data: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal = await db.addGoal(data)
    if (goal) setGoals(prev => [...prev, goal])
  }, [])

  const updateGoal = useCallback(async (id: string, data: Partial<Goal>) => {
    await db.updateGoal(id, data)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g))
  }, [])

  const deleteGoal = useCallback(async (id: string) => {
    await db.deleteGoal(id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [])

  // ── Budget CRUD ───────────────────────────────────────────
  const addBudget = useCallback(async (data: Omit<Budget, 'id'>) => {
    const budget = await db.addBudget(data)
    if (budget) setBudgets(prev => [...prev, budget])
  }, [])

  const deleteBudget = useCallback(async (id: string) => {
    await db.deleteBudget(id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }, [])

  // ── Settings update ───────────────────────────────────────
  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    await db.upsertSettings(updated)
  }, [settings])

  // ── Clear all data ────────────────────────────────────────
  const clearAllData = useCallback(async () => {
    // Delete all rows for current user (cascade handles transactions)
    await Promise.all([
      ...accounts.map(a => db.deleteAccount(a.id)),
      ...goals.map(g => db.deleteGoal(g.id)),
      ...budgets.map(b => db.deleteBudget(b.id)),
    ])
    await db.upsertSettings(DEFAULT_SETTINGS)
    setAccounts([])
    setTransactions([])
    setGoals([])
    setBudgets([])
    setSettings(DEFAULT_SETTINGS)
  }, [accounts, goals, budgets])

  // ── Sign out ──────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // ── Page renderer ─────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            accounts={accounts} transactions={transactions}
            goals={goals} budgets={budgets} settings={settings}
            onNavigate={setActivePage}
          />
        )
      case 'transactions':
        return (
          <Transactions
            accounts={accounts} transactions={transactions} settings={settings}
            onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction}
          />
        )
      case 'budget':
        return (
          <BudgetPage
            budgets={budgets} transactions={transactions} settings={settings}
            onAdd={addBudget} onDelete={deleteBudget}
          />
        )
      case 'goals':
        return (
          <Goals
            goals={goals}
            onAdd={addGoal} onUpdate={updateGoal} onDelete={deleteGoal}
          />
        )
      case 'accounts':
        return (
          <Accounts
            accounts={accounts} settings={settings}
            getBalance={finance.getAccountBalance}
            getTransactionCount={finance.getTransactionCount}
            onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            settings={settings} accounts={accounts}
            onUpdateSettings={updateSettings}
            onClearData={clearAllData}
            onSignOut={handleSignOut}
          />
        )
      default:
        return null
    }
  }

  // ── Render ────────────────────────────────────────────────
  if (authLoading) return <LoadingScreen />
  if (!user)       return <Login />

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}
