# CENTAVOS — App de Finanzas Personales

App de finanzas personales para emprendedores y creadores venezolanos que manejan dinero en **USD y VES simultáneamente**. La dualidad de monedas es protagonista: un **toggle global USD/VES** recalcula toda la app usando una **tasa de cambio** (manual o en vivo), y el patrimonio se muestra con su **composición USD/VES**.

> **Diseño 2026** — dirección minimalista, oscura y premium (estilo Linear/Vercel para finanzas): un único acento verde, un tono "arena" reservado para los bolívares, tipografía sobria e íconos de línea. Sin emojis en la UI.

## Features

- **Dashboard** — patrimonio neto (hero) + barra de composición USD/VES + sparkline, KPIs del mes con deltas, gráfico de flujo de caja (con tooltip al pasar el mouse), gastos por categoría, y previews de movimientos/cuentas/metas.
- **Movimientos** — ingresos, gastos y transferencias (con comisión automática), filtros segmentados + búsqueda + filtros por categoría/cuenta/etiqueta, etiquetas, recurrentes, exportar a PDF.
- **Presupuesto** — límites mensuales por categoría con barras de color según % usado (verde < 75% · ámbar 75–94% · rojo ≥ 95%).
- **Metas de ahorro** — tarjetas con % grande, barra de progreso y "Agregar fondos".
- **Cuentas** — múltiples cuentas en USD o VES, balance nativo + equivalencia, historial de saldos.
- **Deudas** — seguimiento de lo que debes y lo que te deben, con pagos parciales.
- **Anual** — resumen de ingresos/gastos/ahorro por mes del año.
- **Configuración** — tasa de cambio manual o **en vivo** (ve.dolarapi.com), moneda por defecto, categorías personalizadas, exportar/importar JSON, borrar datos.

## Tech Stack

| Tecnología | Versión |
|------------|---------|
| React | 19.x |
| Vite | 7.x |
| TypeScript | 5.9 |
| Tailwind CSS | 4.x (sin `tailwind.config.js`, tokens en `@theme`) |
| Recharts | 3.x |
| Supabase JS | 2.x (auth + base de datos) |

Fuentes: **Hanken Grotesk** (UI) · **JetBrains Mono** (montos, %, fechas, tasas) via Google Fonts.

## Arquitectura

- **Routing** — por estado local (`activePage` en `App.tsx`), sin react-router.
- **Auth** — Supabase: email/contraseña + Google OAuth (flujo implícito).
- **Almacenamiento** — Supabase (PostgreSQL) vía `src/lib/db.ts`. Todas las operaciones CRUD pasan por ahí.
- **Moneda de visualización** — estado global `displayCurrency` (USD/VES) en `App.tsx`, persistido en `localStorage` (`cnt:cur`), pasado a cada página. Los montos se guardan normalizados y se muestran según el toggle; las cuentas muestran su moneda nativa + equivalencia.

## Instalación y uso

```bash
cd centavos
npm install
npm run dev        # Servidor de desarrollo en http://localhost:5173
npm run build      # tsc -b + build de producción
npm run preview    # Vista previa del build
```

### Variables de entorno (`.env.local`)

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key completa>
```

## Estructura del proyecto

```
src/
  types/index.ts          # Interfaces: Account, Transaction, Budget, Goal, Debt, Settings, Page
  utils/
    constants.ts          # Categorías, tipos de cuenta, colores
    currency.ts           # toUSD/toVES, formatDisplay/formatNative/groupInt, helpers de mes
    storage.ts            # Export/import JSON
  lib/
    supabase.ts           # Cliente Supabase (singleton)
    db.ts                 # Todas las operaciones CRUD (Supabase)
  hooks/
    useFinance.ts         # Calculados: netWorth, balances, totales mensuales, etc.
    useIsMobile.ts        # Breakpoint responsive
  components/
    layout/
      Sidebar.tsx         # Nav 226px (wordmark ¢, ítem activo con barra verde, tasa + perfil)
      Topbar.tsx          # Breadcrumb + toggle USD/VES + navegador de mes + acción "+ Nuevo"
    ui/
      Icon.tsx            # Set de íconos de línea estilo Lucide (SVG inline, sin dependencia)
      styles.ts           # Helpers de estilo compartidos (card, botones, labels, pctColor)
      Modal.tsx           # Diálogo centrado (bottom-sheet en móvil)
      ProgressBar.tsx · EmptyState.tsx · TypeSelector.tsx · CurrencyInput.tsx
  pages/
    Dashboard.tsx · Transactions.tsx · Budget.tsx · Goals.tsx
    Accounts.tsx · Debts.tsx · Annual.tsx · Settings.tsx · Login.tsx
  App.tsx                 # Auth, carga de datos, CRUD handlers, routing por estado
  main.tsx                # Punto de entrada
```

## Data Model

```typescript
interface Account   { id; name; type: 'cash'|'bank'|'digital'|'savings'|'invest'; currency: 'USD'|'VES'; initialBalance: number; color; createdAt }
interface Transaction { id; date /*YYYY-MM-DD*/; type: 'income'|'expense'|'transfer'; amount; currency: 'USD'|'VES'; category; accountId; toAccountId?; note?; tags?; isRecurring?; recurringInterval?; createdAt }
interface Budget    { id; month /*YYYY-MM*/; category; limit; currency: 'USD'|'VES' }
interface Goal      { id; name; emoji; target; saved; currency: 'USD'|'VES'; deadline?; note?; createdAt }
interface Debt      { id; name; counterparty; amount; currency: 'USD'|'VES'; type: 'owed_by_me'|'owed_to_me'; dueDate?; note?; status: 'pending'|'partial'|'paid'; paidAmount; createdAt }
interface Settings  { exchangeRate; defaultCurrency: 'USD'|'VES'; defaultAccountId; exchangeRateUpdatedAt?; customExpenseCategories: string[]; customIncomeCategories: string[] }
```

## Lógica de balances

```
balance(cuenta) = initialBalance
  + Σ income    donde accountId = id
  - Σ expense   donde accountId = id
  - Σ transfer  donde accountId = id        (origen)
  + Σ transfer  donde toAccountId = id       (destino)

netWorth = Σ cuentas → (currency === 'VES' ? balance / exchangeRate : balance)   // en USD
```

## Sistema de diseño (tokens en `src/index.css`)

| Rol | Hex |
|-----|-----|
| Fondo | `#09090b` |
| Superficie / card | `#0e0e10` |
| Borde | `#1c1c1f` / `#26262b` |
| Texto / mute | `#fafafa` / `#71717a` |
| **Acento verde** (acción, USD, positivo) | `#3ecf8e` |
| **Arena** (VES) | `#cbb389` / `#d9a441` |
| Gasto / alerta | `#f0716a` |

Mapa de presupuesto por % usado: `< 75%` verde · `75–94%` ámbar · `≥ 95%` rojo.

## Despliegue

Auto-deploy en **Vercel** al hacer push a `main`. Requiere las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas en el proyecto de Vercel.
