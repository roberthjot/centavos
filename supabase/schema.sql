-- ============================================================
-- CENTAVOS — Supabase Database Schema
-- Run this in the Supabase SQL Editor (one time)
-- ============================================================

-- ── accounts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  type          TEXT        NOT NULL,   -- cash | bank | digital | savings | invest
  currency      TEXT        NOT NULL DEFAULT 'USD',
  initial_balance NUMERIC   NOT NULL DEFAULT 0,
  color         TEXT        NOT NULL DEFAULT '#8b5cf6',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id      UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id   UUID        REFERENCES accounts(id) ON DELETE SET NULL,
  date            DATE        NOT NULL DEFAULT CURRENT_DATE,
  type            TEXT        NOT NULL,   -- income | expense | transfer
  amount          NUMERIC     NOT NULL,
  currency        TEXT        NOT NULL DEFAULT 'USD',
  category        TEXT        NOT NULL,
  note            TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── budgets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month        TEXT     NOT NULL,   -- YYYY-MM
  category     TEXT     NOT NULL,
  limit_amount NUMERIC  NOT NULL,
  currency     TEXT     NOT NULL DEFAULT 'USD'
);

-- ── goals ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  emoji      TEXT        NOT NULL DEFAULT '💰',
  target     NUMERIC     NOT NULL,
  saved      NUMERIC     NOT NULL DEFAULT 0,
  currency   TEXT        NOT NULL DEFAULT 'USD',
  deadline   DATE,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── settings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  user_id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_rate             NUMERIC     NOT NULL DEFAULT 40,
  exchange_rate_updated_at  TIMESTAMPTZ,
  default_currency          TEXT        NOT NULL DEFAULT 'USD',
  default_account_id        TEXT        DEFAULT ''
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;

-- Each user only sees and modifies their own rows.
-- WITH CHECK is required for INSERT/UPDATE operations (USING alone only covers SELECT/DELETE).
CREATE POLICY "own_accounts"     ON accounts     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_transactions" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_budgets"      ON budgets      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_goals"        ON goals        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_settings"     ON settings     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Indexes (performance) ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user  ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date  ON transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_user      ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets (user_id, month);
