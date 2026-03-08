// Settings page — exchange rate, defaults, data management, app info
import { useState } from 'react'
import type { Account, Settings as SettingsType } from '../types'
import { exportAllData, importAllData } from '../utils/storage'

interface SettingsProps {
  settings: SettingsType
  accounts: Account[]
  onUpdateSettings: (s: Partial<SettingsType>) => void
  onClearData: () => void
}

export function Settings({ settings, accounts, onUpdateSettings, onClearData }: SettingsProps) {
  const [rateInput, setRateInput] = useState(String(settings.exchangeRate))
  const [rateSaved, setRateSaved] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState('')

  const saveRate = () => {
    const n = parseFloat(rateInput)
    if (isNaN(n) || n <= 0) return
    onUpdateSettings({
      exchangeRate: n,
      exchangeRateUpdatedAt: new Date().toISOString(),
    })
    setRateSaved(true)
    setTimeout(() => setRateSaved(false), 2000)
  }

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `centavos-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        importAllData(data)
        setImportStatus('✅ Datos importados. Recarga la página para ver los cambios.')
      } catch {
        setImportStatus('❌ Error al leer el archivo. Asegúrate de que sea un JSON válido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClear = () => {
    if (!clearConfirm) {
      setClearConfirm(true)
      return
    }
    onClearData()
    setClearConfirm(false)
  }

  const sectionTitle = (text: string) => (
    <h2 style={{
      margin: '0 0 20px 0',
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: '16px',
      color: '#eeeef8',
      paddingBottom: '12px',
      borderBottom: '1px solid #18183a',
    }}>
      {text}
    </h2>
  )

  const card = (children: React.ReactNode) => (
    <div style={{
      background: '#0c0c1e',
      border: '1px solid #18183a',
      borderRadius: '10px',
      padding: '24px',
      marginBottom: '20px',
    }}>
      {children}
    </div>
  )

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b6b9e',
    display: 'block',
    marginBottom: '6px',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '9px 18px',
    background: '#8b5cf6',
    color: '#eeeef8',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: 'pointer',
  }

  const btnSecondary: React.CSSProperties = {
    padding: '9px 18px',
    background: '#131328',
    color: '#6b6b9e',
    border: '1px solid #18183a',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: 'pointer',
  }

  const btnDanger: React.CSSProperties = {
    padding: '9px 18px',
    background: clearConfirm ? '#f43f5e' : '#131328',
    color: clearConfirm ? '#fff' : '#f43f5e',
    border: `1px solid ${clearConfirm ? '#f43f5e' : '#f43f5e40'}`,
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div style={{ padding: '32px', maxWidth: '640px' }}>
      <h1 style={{ margin: '0 0 28px 0', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', color: '#eeeef8' }}>
        Configuración
      </h1>

      {/* Exchange rate */}
      {card(
        <>
          {sectionTitle('Tipo de cambio')}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>1 USD =</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={rateInput}
                  onChange={e => setRateInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveRate() }}
                  min="0.01"
                  step="0.01"
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#6b6b9e', fontSize: '14px', flexShrink: 0 }}>VES</span>
              </div>
            </div>
            <button
              onClick={saveRate}
              style={{ ...btnPrimary, background: rateSaved ? '#10d97a' : '#8b5cf6' }}
            >
              {rateSaved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
          {settings.exchangeRateUpdatedAt && (
            <div style={{ fontSize: '11px', color: '#6b6b9e' }}>
              Actualizado: {new Date(settings.exchangeRateUpdatedAt).toLocaleString('es-VE')}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#6b6b9e', marginTop: '8px' }}>
            Actualiza este valor manualmente según el tipo de cambio oficial o de tu preferencia.
          </div>
        </>,
      )}

      {/* Defaults */}
      {card(
        <>
          {sectionTitle('Preferencias por defecto')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Moneda predeterminada</label>
              <select
                value={settings.defaultCurrency}
                onChange={e => onUpdateSettings({ defaultCurrency: e.target.value as 'USD' | 'VES' })}
              >
                <option value="USD">USD — Dólar americano</option>
                <option value="VES">VES — Bolívar venezolano</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Cuenta predeterminada</label>
              <select
                value={settings.defaultAccountId}
                onChange={e => onUpdateSettings({ defaultAccountId: e.target.value })}
              >
                <option value="">Sin predeterminada</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </>,
      )}

      {/* Data management */}
      {card(
        <>
          {sectionTitle('Gestión de datos')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#eeeef8', marginBottom: '2px' }}>Exportar datos</div>
                <div style={{ fontSize: '12px', color: '#6b6b9e' }}>Descarga un backup completo como JSON</div>
              </div>
              <button onClick={handleExport} style={btnSecondary}>
                Exportar JSON
              </button>
            </div>

            <div style={{ borderTop: '1px solid #18183a', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#eeeef8', marginBottom: '2px' }}>Importar datos</div>
                <div style={{ fontSize: '12px', color: '#6b6b9e' }}>Restaura desde un archivo JSON exportado</div>
              </div>
              <label style={{ ...btnSecondary, display: 'inline-block', textAlign: 'center' }}>
                Importar JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {importStatus && (
              <div style={{ fontSize: '12px', color: importStatus.startsWith('✅') ? '#10d97a' : '#f43f5e', padding: '8px 12px', background: '#131328', borderRadius: '6px' }}>
                {importStatus}
              </div>
            )}

            <div style={{ borderTop: '1px solid #18183a', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#f43f5e', marginBottom: '2px' }}>Borrar todos los datos</div>
                <div style={{ fontSize: '12px', color: '#6b6b9e' }}>
                  {clearConfirm ? '⚠ Esta acción no se puede deshacer. ¿Confirmar?' : 'Elimina cuentas, transacciones, metas y presupuestos'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {clearConfirm && (
                  <button onClick={() => setClearConfirm(false)} style={btnSecondary}>
                    No
                  </button>
                )}
                <button onClick={handleClear} style={btnDanger}>
                  {clearConfirm ? 'Sí, borrar' : 'Borrar datos'}
                </button>
              </div>
            </div>
          </div>
        </>,
      )}

      {/* App info */}
      {card(
        <>
          {sectionTitle('Información')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b6b9e' }}>Versión</span>
              <span style={{ color: '#eeeef8' }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b6b9e' }}>Tecnología</span>
              <span style={{ color: '#eeeef8' }}>React 19 + Vite + TypeScript</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b6b9e' }}>Almacenamiento</span>
              <span style={{ color: '#eeeef8' }}>localStorage (offline)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b6b9e' }}>Monedas</span>
              <span style={{ color: '#eeeef8' }}>USD · VES</span>
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b6b9e', lineHeight: 1.6 }}>
            CENTAVOS — App de finanzas personales para emprendedores venezolanos.
            Todos los datos se guardan localmente en tu navegador. Sin servidores, sin cuentas.
          </div>
        </>,
      )}
    </div>
  )
}
