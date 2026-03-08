// ============================================================
// CENTAVOS — Supabase data layer
// All DB operations are here. App.tsx calls these functions.
// snake_case DB columns ↔ camelCase TypeScript interfaces.
// ============================================================
import { supabase } from './supabase'
import type { Account, Transaction, Budget, Goal, Settings } from '../types'

// ── Row types (Supabase returns snake_case) ──────────────────

interface AccountRow {
  id: string; user_id: string; name: string; type: string
  currency: string; initial_balance: number; color: string; created_at: string
}

interface TransactionRow {
  id: string; user_id: string; account_id: string; to_account_id: string | null
  date: string; type: string; amount: number; currency: string
  category: string; note: string | null; tags: string[] | null; created_at: string
}

interface BudgetRow {
  id: string; user_id: string; month: string
  category: string; limit_amount: number; currency: string
}

interface GoalRow {
  id: string; user_id: string; name: string; emoji: string
  target: number; saved: number; currency: string
  deadline: string | null; note: string | null; created_at: string
}

interface SettingsRow {
  user_id: string; exchange_rate: number; exchange_rate_updated_at: string | null
  default_currency: string; default_account_id: string | null
}

// ── Auth helper ───────────────────────────────────────────────
// getSession() reads from localStorage (no network call) — safe to call often.
async function uid(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  return session.user.id
}

// ── Mappers (DB row → TypeScript interface) ──────────────────

const mapAccount = (r: AccountRow): Account => ({
  id: r.id, name: r.name, type: r.type as Account['type'],
  currency: r.currency as 'USD' | 'VES', initialBalance: r.initial_balance,
  color: r.color, createdAt: r.created_at,
})

const mapTransaction = (r: TransactionRow): Transaction => ({
  id: r.id, date: r.date, type: r.type as Transaction['type'],
  amount: r.amount, currency: r.currency as 'USD' | 'VES',
  category: r.category, accountId: r.account_id,
  toAccountId: r.to_account_id ?? undefined,
  note: r.note ?? undefined, tags: r.tags ?? undefined,
  createdAt: r.created_at,
})

const mapBudget = (r: BudgetRow): Budget => ({
  id: r.id, month: r.month, category: r.category,
  limit: r.limit_amount, currency: r.currency as 'USD' | 'VES',
})

const mapGoal = (r: GoalRow): Goal => ({
  id: r.id, name: r.name, emoji: r.emoji, target: r.target,
  saved: r.saved, currency: r.currency as 'USD' | 'VES',
  deadline: r.deadline ?? undefined, note: r.note ?? undefined,
  createdAt: r.created_at,
})

const mapSettings = (r: SettingsRow): Settings => ({
  exchangeRate: r.exchange_rate,
  exchangeRateUpdatedAt: r.exchange_rate_updated_at ?? undefined,
  defaultCurrency: r.default_currency as 'USD' | 'VES',
  defaultAccountId: r.default_account_id ?? '',
})

// ── Accounts ─────────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts').select('*').order('created_at', { ascending: true })
  if (error) { console.error('getAccounts:', error); return [] }
  return (data as AccountRow[]).map(mapAccount)
}

export async function addAccount(d: Omit<Account, 'id' | 'createdAt'>): Promise<Account | null> {
  const { data, error } = await supabase.from('accounts').insert({
    user_id: await uid(),                          // required: RLS checks auth.uid() = user_id
    name: d.name, type: d.type, currency: d.currency,
    initial_balance: d.initialBalance, color: d.color,
  }).select().single()
  if (error) { console.error('addAccount:', error); return null }
  return mapAccount(data as AccountRow)
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) console.error('deleteAccount:', error)
}

// ── Transactions ─────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions').select('*').order('date', { ascending: false })
  if (error) { console.error('getTransactions:', error); return [] }
  return (data as TransactionRow[]).map(mapTransaction)
}

export async function addTransaction(d: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction | null> {
  const { data, error } = await supabase.from('transactions').insert({
    user_id: await uid(),                          // required: RLS checks auth.uid() = user_id
    account_id: d.accountId, to_account_id: d.toAccountId ?? null,
    date: d.date, type: d.type, amount: d.amount, currency: d.currency,
    category: d.category, note: d.note ?? null, tags: d.tags ?? null,
  }).select().single()
  if (error) { console.error('addTransaction:', error); return null }
  return mapTransaction(data as TransactionRow)
}

export async function updateTransaction(id: string, d: Partial<Transaction>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (d.date !== undefined)        patch.date           = d.date
  if (d.type !== undefined)        patch.type           = d.type
  if (d.amount !== undefined)      patch.amount         = d.amount
  if (d.currency !== undefined)    patch.currency       = d.currency
  if (d.category !== undefined)    patch.category       = d.category
  if (d.accountId !== undefined)   patch.account_id     = d.accountId
  if (d.toAccountId !== undefined) patch.to_account_id  = d.toAccountId
  if (d.note !== undefined)        patch.note           = d.note
  if (d.tags !== undefined)        patch.tags           = d.tags
  const { error } = await supabase.from('transactions').update(patch).eq('id', id)
  if (error) console.error('updateTransaction:', error)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) console.error('deleteTransaction:', error)
}

// ── Budgets ──────────────────────────────────────────────────

export async function getBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select('*')
  if (error) { console.error('getBudgets:', error); return [] }
  return (data as BudgetRow[]).map(mapBudget)
}

export async function addBudget(d: Omit<Budget, 'id'>): Promise<Budget | null> {
  const { data, error } = await supabase.from('budgets').insert({
    user_id: await uid(),                          // required: RLS checks auth.uid() = user_id
    month: d.month, category: d.category,
    limit_amount: d.limit, currency: d.currency,
  }).select().single()
  if (error) { console.error('addBudget:', error); return null }
  return mapBudget(data as BudgetRow)
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) console.error('deleteBudget:', error)
}

// ── Goals ────────────────────────────────────────────────────

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals').select('*').order('created_at', { ascending: true })
  if (error) { console.error('getGoals:', error); return [] }
  return (data as GoalRow[]).map(mapGoal)
}

export async function addGoal(d: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal | null> {
  const { data, error } = await supabase.from('goals').insert({
    user_id: await uid(),                          // required: RLS checks auth.uid() = user_id
    name: d.name, emoji: d.emoji, target: d.target, saved: d.saved,
    currency: d.currency, deadline: d.deadline ?? null, note: d.note ?? null,
  }).select().single()
  if (error) { console.error('addGoal:', error); return null }
  return mapGoal(data as GoalRow)
}

export async function updateGoal(id: string, d: Partial<Goal>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (d.name !== undefined)     patch.name     = d.name
  if (d.emoji !== undefined)    patch.emoji    = d.emoji
  if (d.target !== undefined)   patch.target   = d.target
  if (d.saved !== undefined)    patch.saved    = d.saved
  if (d.currency !== undefined) patch.currency = d.currency
  if (d.deadline !== undefined) patch.deadline = d.deadline
  if (d.note !== undefined)     patch.note     = d.note
  const { error } = await supabase.from('goals').update(patch).eq('id', id)
  if (error) console.error('updateGoal:', error)
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) console.error('deleteGoal:', error)
}

// ── Settings ─────────────────────────────────────────────────

export async function getSettings(): Promise<Settings | null> {
  // maybeSingle() returns null (no error) when no row exists — avoids 406 on first login
  const { data, error } = await supabase.from('settings').select('*').maybeSingle()
  if (error) { console.error('getSettings:', error); return null }
  if (!data) return null
  return mapSettings(data as SettingsRow)
}

export async function upsertSettings(s: Settings): Promise<void> {
  const { error } = await supabase.from('settings').upsert({
    user_id: await uid(),                          // required: PK + RLS checks auth.uid() = user_id
    exchange_rate: s.exchangeRate,
    exchange_rate_updated_at: s.exchangeRateUpdatedAt ?? null,
    default_currency: s.defaultCurrency,
    default_account_id: s.defaultAccountId || null,
  })
  if (error) console.error('upsertSettings:', error)
}
