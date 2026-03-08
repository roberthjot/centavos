# CENTAVOS — App de Finanzas Personales

App de finanzas personales para emprendedores venezolanos que manejan dinero en **USD y VES simultáneamente**. Sin backend, sin cuentas — todo se guarda localmente en el navegador.

## Features

- **Dashboard** — KPIs, gráfico de área (últimos 6 meses), donut de categorías, resumen de cuentas y metas
- **Movimientos** — registro de ingresos, gastos y transferencias con filtros por mes/tipo/categoría/cuenta
- **Presupuesto** — límites mensuales por categoría con progress bar verde/amarillo/rojo
- **Metas de ahorro** — seguimiento visual con fechas límite y botón "Agregar fondos"
- **Cuentas** — múltiples cuentas en USD o VES, balances calculados en tiempo real
- **Configuración** — tipo de cambio manual, exportar/importar JSON, borrar datos

## Tech Stack

| Tecnología | Versión |
|------------|---------|
| React | 19.x |
| Vite | 7.x |
| TypeScript | 5.9 |
| Tailwind CSS | 4.x |
| Recharts | 3.x |

Fuentes: **IBM Plex Mono** (cuerpo/números) · **Syne 800** (títulos) via Google Fonts

## Instalación y uso

```bash
cd centavos
npm install
npm run dev        # Servidor de desarrollo en http://localhost:5173
npm run build      # Build de producción
npm run preview    # Vista previa del build
```

## Estructura del proyecto

```
src/
  types/
    index.ts            # Interfaces TypeScript: Account, Transaction, Budget, Goal, Settings
  utils/
    constants.ts        # Categorías, colores, tipos de cuenta, emojis de metas
    storage.ts          # Helpers de localStorage (getItem/setItem/exportAllData/importAllData)
    currency.ts         # toUSD, toVES, formatUSD, formatVES, formatAmount, formatCompact
  hooks/
    useStorage.ts       # Hook reactivo de localStorage (soporta updater funcional)
    useFinance.ts       # Valores calculados: netWorth, accountBalances, monthlyTotals, etc.
  components/
    layout/
      Sidebar.tsx       # Navegación fija de 210px de ancho
    ui/
      Modal.tsx         # Overlay con backdrop blur, ESC/click-outside para cerrar
      KPICard.tsx       # Tarjeta de métrica con ícono y accent color
      ProgressBar.tsx   # Barra de progreso animada con color configurable
      AccountCard.tsx   # Tarjeta de cuenta con color stripe en la parte superior
      GoalCard.tsx      # Tarjeta de meta con modal "Agregar fondos" integrado
      BudgetCard.tsx    # Tarjeta de presupuesto con estado de excedido
      TransactionRow.tsx    # Fila de tabla de transacciones con hover y delete
      TypeSelector.tsx      # Tabs Ingreso/Gasto/Transferencia con color coding
      CurrencyInput.tsx     # Input numérico con selector USD/VES inline
      ColorPicker.tsx       # 8 swatches de color para cuentas
      EmptyState.tsx        # Estado vacío reutilizable con emoji + CTA
  pages/
    Dashboard.tsx       # Página principal con gráficos, KPIs y previews
    Transactions.tsx    # Tabla filtrable con modal de alta/edición
    Budget.tsx          # Presupuesto mensual por categoría
    Goals.tsx           # Metas de ahorro con progress tracking
    Accounts.tsx        # Gestión de cuentas
    Settings.tsx        # Tipo de cambio, preferencias y gestión de datos
  App.tsx               # Routing por estado + todos los CRUD handlers
  main.tsx              # Punto de entrada de la app
```

## Data Model

```typescript
interface Account {
  id: string
  name: string
  type: 'cash' | 'bank' | 'digital' | 'savings' | 'invest'
  currency: 'USD' | 'VES'
  initialBalance: number
  color: string
  createdAt: string
}

interface Transaction {
  id: string
  date: string          // YYYY-MM-DD
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: 'USD' | 'VES'
  category: string
  accountId: string
  toAccountId?: string  // solo para transferencias
  note?: string
  createdAt: string
}

interface Budget {
  id: string
  month: string         // YYYY-MM
  category: string
  limit: number
  currency: 'USD' | 'VES'
}

interface Goal {
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

interface Settings {
  exchangeRate: number            // 1 USD = N VES
  defaultCurrency: 'USD' | 'VES'
  defaultAccountId: string
  exchangeRateUpdatedAt?: string
}
```

## Lógica de balances

```
balance(cuenta) = initialBalance
  + Σ transacciones tipo 'income'    donde accountId = id
  - Σ transacciones tipo 'expense'   donde accountId = id
  - Σ transacciones tipo 'transfer'  donde accountId = id (origen)
  + Σ transacciones tipo 'transfer'  donde toAccountId = id (destino)

netWorth = Σ cuentas.map(c =>
  c.currency === 'VES'
    ? balance(c) / exchangeRate
    : balance(c)
)
```

## localStorage keys

| Clave | Contenido |
|-------|-----------|
| `fin:accounts` | `Account[]` |
| `fin:transactions` | `Transaction[]` |
| `fin:budgets` | `Budget[]` |
| `fin:goals` | `Goal[]` |
| `fin:settings` | `Settings` |
| `fin:activePage` | Página activa |

## Exportar / Importar datos

En **Config → Gestión de datos**:
- **Exportar** — descarga `centavos-backup-YYYY-MM-DD.json` con todos los datos
- **Importar** — restaura desde un JSON exportado anteriormente
- **Borrar** — limpia todo el localStorage (requiere confirmación doble)

---

Dark theme. Paleta principal:
`#06060f` fondo · `#8b5cf6` accent · `#10d97a` ingresos · `#f43f5e` gastos · `#38bdf8` transferencias
