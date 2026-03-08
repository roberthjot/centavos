// ===== CENTAVOS — App Constants =====

// ----- Transaction Categories -----

export const EXPENSE_CATEGORIES = [
  'Comida',
  'Transporte',
  'Vivienda',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Ropa',
  'Servicios',
  'Tecnología',
  'Personal',
  'Deudas',
  'Suscripciones',
  'Otro gasto',
] as const

export const INCOME_CATEGORIES = [
  'Clipping',
  'YouTube/TikTok',
  'Freelance',
  'Salario',
  'Inversión',
  'Venta',
  'Transferencia recibida',
  'Otro ingreso',
] as const

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES] as const

// ----- Account Types -----

export const ACCOUNT_TYPES = [
  { value: 'cash',    label: 'Efectivo',    emoji: '💵' },
  { value: 'bank',    label: 'Banco',       emoji: '🏦' },
  { value: 'digital', label: 'Digital',     emoji: '💳' },
  { value: 'savings', label: 'Ahorros',     emoji: '🐷' },
  { value: 'invest',  label: 'Inversión',   emoji: '📈' },
] as const

// ----- Color Swatches (8 options for account cards) -----

export const ACCOUNT_COLORS = [
  '#10d97a', // green
  '#f59e0b', // yellow
  '#38bdf8', // blue
  '#8b5cf6', // purple
  '#f43f5e', // red
  '#fb923c', // orange
  '#a3e635', // lime
  '#e879f9', // fuchsia
] as const

// ----- Goal Emojis (15 options) -----

export const GOAL_EMOJIS = [
  '🏠', '🚗', '✈️', '💻', '📱',
  '🎓', '💍', '🏖️', '💪', '🎮',
  '📸', '🎸', '👟', '🛵', '💰',
] as const

// ----- localStorage Keys -----

export const STORAGE_KEYS = {
  accounts:     'fin:accounts',
  transactions: 'fin:transactions',
  goals:        'fin:goals',
  budgets:      'fin:budgets',
  settings:     'fin:settings',
} as const

// ----- Default Data (loaded on first run) -----

export const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Efectivo USD',
    type: 'cash' as const,
    currency: 'USD' as const,
    initialBalance: 0,
    color: '#10d97a',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    name: 'Binance/USDT',
    type: 'digital' as const,
    currency: 'USD' as const,
    initialBalance: 0,
    color: '#f59e0b',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-3',
    name: 'Efectivo VES',
    type: 'cash' as const,
    currency: 'VES' as const,
    initialBalance: 0,
    color: '#38bdf8',
    createdAt: new Date().toISOString(),
  },
]

export const DEFAULT_SETTINGS = {
  exchangeRate: 40,
  defaultCurrency: 'USD' as const,
  defaultAccountId: 'acc-1',
}

// ----- Category Emoji Map (for visual display) -----

export const CATEGORY_EMOJI: Record<string, string> = {
  'Comida': '🍔',
  'Transporte': '🚌',
  'Vivienda': '🏠',
  'Entretenimiento': '🎬',
  'Salud': '🏥',
  'Educación': '📚',
  'Ropa': '👗',
  'Servicios': '💡',
  'Tecnología': '💻',
  'Personal': '🧴',
  'Deudas': '💸',
  'Suscripciones': '📦',
  'Otro gasto': '🔖',
  'Clipping': '✂️',
  'YouTube/TikTok': '🎥',
  'Freelance': '🧑‍💻',
  'Salario': '💼',
  'Inversión': '📈',
  'Venta': '🏷️',
  'Transferencia recibida': '↙️',
  'Otro ingreso': '💰',
}
