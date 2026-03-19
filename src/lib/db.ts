// ============================================================
// CENTAVOS — Supabase data layer
// All DB operations are here. App.tsx calls these functions.
// snake_case DB columns ↔ camelCase TypeScript interfaces.
// ============================================================
import { supabase } from './supabase'
import type { Account, Transaction, Budget, Goal, Debt, Settings } from '../types'

// ── Row types (Supabase returns snake_case) ──────────────────

interface AccountRow {
  id: string; user_id: string; name: string; type: string
  currency: string; initial_balance: number; color: string; created_at: string
}

interface TransactionRow {
  id: string; user_id: string; account_id: string; to_account_id: string | null
  date: string; type: string; amount: number; currency: string
  category: string; note: string | null; tags: string[] | null
  is_recurring: boolean | null; recurring_interval: string | null
  created_at: string
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

interface DebtRow {
  id: string; user_id: string; name: string; counterparty: string
  amount: number; currency: string; type: string
  due_date: string | null; note: string | null
  status: string; paid_amount: number; created_at: string
}

interface SettingsRow {
  user_id: string; exchange_rate: number; exchange_rate_updated_at: string | null
  default_currency: string; default_account_id: string | null
  custom_expense_categories: string[] | null
  custom_income_categories:  string[] | null
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
  isRecurring: r.is_recurring ?? false,
  recurringInterval: r.recurring_interval as Transaction['recurringInterval'] ?? undefined,
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

const mapDebt = (r: DebtRow): Debt => ({
  id: r.id, name: r.name, counterparty: r.counterparty,
  amount: r.amount, currency: r.currency as 'USD' | 'VES',
  type: r.type as Debt['type'],
  dueDate: r.due_date ?? undefined, note: r.note ?? undefined,
  status: r.status as Debt['status'], paidAmount: r.paid_amount,
  createdAt: r.created_at,
})

const mapSettings = (r: SettingsRow): Settings => ({
  exchangeRate: r.exchange_rate,
  exchangeRateUpdatedAt: r.exchange_rate_updated_at ?? undefined,
  defaultCurrency: r.default_currency as 'USD' | 'VES',
  defaultAccountId: r.default_account_id ?? '',
  customExpenseCategories: r.custom_expense_categories ?? [],
  customIncomeCategories:  r.custom_income_categories  ?? [],
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

export async function updateAccount(id: string, d: Partial<Omit<Account, 'id' | 'createdAt'>>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (d.name           !== undefined) patch.name            = d.name
  if (d.type           !== undefined) patch.type            = d.type
  if (d.currency       !== undefined) patch.currency        = d.currency
  if (d.initialBalance !== undefined) patch.initial_balance = d.initialBalance
  if (d.color          !== undefined) patch.color           = d.color
  const { error } = await supabase.from('accounts').update(patch).eq('id', id)
  if (error) console.error('updateAccount:', error)
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
    is_recurring: d.isRecurring ?? false,
    recurring_interval: d.recurringInterval ?? null,
  }).select().single()
  if (error) { console.error('addTransaction:', error); return null }
  return mapTransaction(data as TransactionRow)
}

export async function updateTransaction(id: string, d: Partial<Transaction>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (d.date              !== undefined) patch.date               = d.date
  if (d.type              !== undefined) patch.type               = d.type
  if (d.amount            !== undefined) patch.amount             = d.amount
  if (d.currency          !== undefined) patch.currency           = d.currency
  if (d.category          !== undefined) patch.category           = d.category
  if (d.accountId         !== undefined) patch.account_id         = d.accountId
  if (d.toAccountId       !== undefined) patch.to_account_id      = d.toAccountId
  if (d.note              !== undefined) patch.note               = d.note
  if (d.tags              !== undefined) patch.tags               = d.tags
  if (d.isRecurring       !== undefined) patch.is_recurring       = d.isRecurring
  if (d.recurringInterval !== undefined) patch.recurring_interval = d.recurringInterval
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

// ── Debts ────────────────────────────────────────────────────

export async function getDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts').select('*').order('created_at', { ascending: false })
  if (error) { console.error('getDebts:', error); return [] }
  return (data as DebtRow[]).map(mapDebt)
}

export async function addDebt(d: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt | null> {
  const { data, error } = await supabase.from('debts').insert({
    user_id: await uid(),
    name: d.name, counterparty: d.counterparty,
    amount: d.amount, currency: d.currency, type: d.type,
    due_date: d.dueDate ?? null, note: d.note ?? null,
    status: d.status, paid_amount: d.paidAmount,
  }).select().single()
  if (error) { console.error('addDebt:', error); return null }
  return mapDebt(data as DebtRow)
}

export async function updateDebt(id: string, d: Partial<Debt>): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (d.name         !== undefined) patch.name         = d.name
  if (d.counterparty !== undefined) patch.counterparty = d.counterparty
  if (d.amount       !== undefined) patch.amount       = d.amount
  if (d.currency     !== undefined) patch.currency     = d.currency
  if (d.type         !== undefined) patch.type         = d.type
  if (d.dueDate      !== undefined) patch.due_date     = d.dueDate
  if (d.note         !== undefined) patch.note         = d.note
  if (d.status       !== undefined) patch.status       = d.status
  if (d.paidAmount   !== undefined) patch.paid_amount  = d.paidAmount
  const { error } = await supabase.from('debts').update(patch).eq('id', id)
  if (error) console.error('updateDebt:', error)
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id)
  if (error) console.error('deleteDebt:', error)
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
    custom_expense_categories: s.customExpenseCategories ?? [],
    custom_income_categories:  s.customIncomeCategories  ?? [],
  })
  if (error) console.error('upsertSettings:', error)
}
