// Settings page — redesigned 2026. Exchange rate (manual + live API), defaults,
// custom categories, data management, info, sign out.
import { useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Account, Settings as SettingsType } from '../types'
import { exportAllData, importAllData } from '../utils/storage'
import { Icon } from '../components/ui/Icon'
import { Topbar } from '../components/layout/Topbar'
import { card, pageTitle, pageSubtitle, btnPrimary, btnGhost, btnDanger } from '../components/ui/styles'

interface DolarRate {
  fuente: string; nombre: string; promedio: number
  compra?: number; venta?: number; fechaActualizacion?: string
}

interface SettingsProps {
  settings: SettingsType
  accounts: Account[]
  displayCurrency: 'USD' | 'VES'
  onCurrencyChange: (cur: 'USD' | 'VES') => void
  tags: string[]
  onUpdateSettings: (s: Partial<SettingsType>) => void
  onDeleteTag: (tag: string) => void
  onRenameTag: (oldTag: string, newTag: string) => void
  onClearData: () => void
  onSignOut: () => void
}

export function Settings({ settings, accounts, displayCurrency, onCurrencyChange, tags, onUpdateSettings, onDeleteTag, onRenameTag, onClearData, onSignOut }: SettingsProps) {
  const isMobile = useIsMobile()
  const [editingTag, setEditingTag] = useState<{ old: string; val: string } | null>(null)
  const [confirmDelTag, setConfirmDelTag] = useState<string | null>(null)

  const [rateInput, setRateInput] = useState(String(settings.exchangeRate))
  const [rateSaved, setRateSaved] = useState(false)
  const [liveRates, setLiveRates] = useState<DolarRate[]>([])
  const [fetchingRates, setFetchingRates] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const [newExpenseCat, setNewExpenseCat] = useState('')
  const [newIncomeCat, setNewIncomeCat] = useState('')
  const [clearConfirm, setClearConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState('')

  const saveRate = () => {
    const n = parseFloat(rateInput)
    if (isNaN(n) || n <= 0) return
    onUpdateSettings({ exchangeRate: n, exchangeRateUpdatedAt: new Date().toISOString() })
    setRateSaved(true); setLiveRates([])
    setTimeout(() => setRateSaved(false), 2000)
  }

  const fetchLiveRates = async () => {
    setFetchingRates(true); setFetchError(''); setLiveRates([])
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as DolarRate[]
      setLiveRates(data.filter(r => r.promedio && r.promedio > 0))
    } catch (err) {
      setFetchError('No se pudo obtener el tipo de cambio. Intenta de nuevo.')
      console.error('fetchLiveRates:', err)
    } finally {
      setFetchingRates(false)
    }
  }

  const applyLiveRate = (rate: DolarRate) => {
    setRateInput(String(rate.promedio))
    onUpdateSettings({ exchangeRate: rate.promedio, exchangeRateUpdatedAt: new Date().toISOString() })
    setLiveRates([]); setRateSaved(true)
    setTimeout(() => setRateSaved(false), 2000)
  }

  const addCat = (kind: 'exp' | 'inc') => {
    const name = (kind === 'exp' ? newExpenseCat : newIncomeCat).trim()
    if (!name) return
    const key = kind === 'exp' ? 'customExpenseCategories' : 'customIncomeCategories'
    const current = settings[key] ?? []
    if (current.includes(name)) return
    onUpdateSettings({ [key]: [...current, name] })
    kind === 'exp' ? setNewExpenseCat('') : setNewIncomeCat('')
  }
  const removeCat = (kind: 'exp' | 'inc', name: string) => {
    const key = kind === 'exp' ? 'customExpenseCategories' : 'customIncomeCategories'
    const current = settings[key] ?? []
    onUpdateSettings({ [key]: current.filter(c => c !== name) })
  }

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `centavos-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { importAllData(JSON.parse(ev.target?.result as string)); setImportStatus('✓ Datos importados. Recarga la página para ver los cambios.') }
      catch { setImportStatus('✕ Error al leer el archivo. Asegúrate de que sea un JSON válido.') }
    }
    reader.readAsText(file); e.target.value = ''
  }
  const handleClear = () => { if (!clearConfirm) { setClearConfirm(true); return } onClearData(); setClearConfirm(false) }

  const sectionTitle = (text: string, sub?: string) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 600 }}>{text}</div>
      {sub && <div style={{ fontSize: '12.5px', color: '#71717a', marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  const sourceName: Record<string, string> = { BCV: 'BCV (oficial)', PARALELO: 'Paralelo', PROMEDIO: 'Promedio', BCVDIGITAL: 'BCV Digital' }

  const curToggle = (val: 'USD' | 'VES', onChange: (c: 'USD' | 'VES') => void) => (
    <div style={{ display: 'flex', background: '#141417', border: '1px solid #26262b', borderRadius: '9px', padding: '2px' }}>
      {(['USD', 'VES'] as const).map(c => (
        <button key={c} onClick={() => onChange(c)} style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: val === c ? '#26262b' : 'transparent', color: val === c ? '#fafafa' : '#71717a' }}>{c}</button>
      ))}
    </div>
  )

  const catColumn = (kind: 'exp' | 'inc', title: string, color: string, list: string[], value: string, setValue: (v: string) => void) => (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color, marginBottom: '12px' }}>{title}</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCat(kind) }} placeholder="Nueva categoría…" maxLength={30} style={{ flex: 1 }} />
        <button onClick={() => addCat(kind)} style={{ width: '40px', borderRadius: '8px', background: '#141417', border: '1px solid #26262b', color, fontSize: '16px' }}>+</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {list.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#52525b' }}>Sin categorías personalizadas</div>
        ) : list.map(cat => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#141417', border: '1px solid #26262b', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', color: '#d4d4d8' }}>{cat}</span>
            <button onClick={() => removeCat(kind, cat)} title="Eliminar" style={{ color: '#52525b', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#f0716a')} onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '20px 16px 40px' : '24px 40px 56px', maxWidth: '760px', animation: 'cnt-fade .2s ease' }}>
      <Topbar pageLabel="Configuración" displayCurrency={displayCurrency} onCurrencyChange={onCurrencyChange} />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitle}>Configuración</h1>
        <p style={pageSubtitle}>Ajustes y gestión de datos</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Exchange rate */}
        <div style={card}>
          {sectionTitle('Tipo de cambio', 'Bolívares por dólar — 1 USD = N VES')}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ fontSize: '14px', color: '#71717a' }}>Bs</span>
            <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRate() }} min="0.01" step="0.01" className="font-mono" style={{ width: '150px' }} />
            <span style={{ fontSize: '13px', color: '#52525b' }}>/ USD</span>
            <button onClick={saveRate} style={{ ...btnPrimary, background: rateSaved ? '#3ecf8e' : '#3ecf8e' }}>{rateSaved ? '✓ Guardado' : 'Guardar'}</button>
            <button onClick={fetchLiveRates} disabled={fetchingRates} style={{ ...btnGhost, opacity: fetchingRates ? 0.6 : 1 }}>
              <Icon name="refresh" size={14} />{fetchingRates ? 'Consultando…' : 'Tasa en vivo'}
            </button>
          </div>
          {settings.exchangeRateUpdatedAt && (
            <div style={{ fontSize: '11px', color: '#52525b', marginTop: '10px' }}>Actualizado: {new Date(settings.exchangeRateUpdatedAt).toLocaleString('es-VE')}</div>
          )}
          {fetchError && <div style={{ marginTop: '10px', fontSize: '12px', color: '#f0716a' }}>{fetchError}</div>}
          {liveRates.length > 0 && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#71717a' }}>Selecciona la tasa que quieres usar:</div>
              {liveRates.map(rate => (
                <button key={rate.fuente} onClick={() => applyLiveRate(rate)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#141417', border: '1px solid #26262b', borderRadius: '8px', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#3ecf8e')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#26262b')}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{sourceName[rate.fuente] ?? rate.nombre}</div>
                    {rate.fechaActualizacion && <div style={{ fontSize: '11px', color: '#52525b', marginTop: '2px' }}>{new Date(rate.fechaActualizacion).toLocaleString('es-VE')}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '15px', fontWeight: 600, color: '#3ecf8e' }}>{rate.promedio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</div>
                    <div style={{ fontSize: '11px', color: '#52525b' }}>por dólar · click para usar</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#52525b', marginTop: '12px' }}>Tasa obtenida de <strong style={{ color: '#a1a1aa' }}>ve.dolarapi.com</strong> — incluye BCV oficial y paralela.</div>
        </div>

        {/* Defaults */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Moneda por defecto</div>
              <div style={{ fontSize: '12.5px', color: '#71717a', marginTop: '4px' }}>Cómo se muestran los montos al iniciar</div>
            </div>
            {curToggle(settings.defaultCurrency, c => onUpdateSettings({ defaultCurrency: c }))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #19191d' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Cuenta por defecto</div>
              <div style={{ fontSize: '12.5px', color: '#71717a', marginTop: '4px' }}>Preseleccionada al crear movimientos</div>
            </div>
            <select value={settings.defaultAccountId} onChange={e => onUpdateSettings({ defaultAccountId: e.target.value })} style={{ width: 'auto', minWidth: '180px' }}>
              <option value="">Sin predeterminada</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {/* Custom categories */}
        <div style={card}>
          {sectionTitle('Categorías personalizadas', 'Aparecerán junto a las predeterminadas al registrar movimientos.')}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
            {catColumn('inc', 'Ingresos', '#3ecf8e', settings.customIncomeCategories ?? [], newIncomeCat, setNewIncomeCat)}
            {catColumn('exp', 'Gastos', '#f0716a', settings.customExpenseCategories ?? [], newExpenseCat, setNewExpenseCat)}
          </div>
        </div>

        {/* Tags */}
        <div style={card}>
          {sectionTitle('Etiquetas', 'Etiquetas usadas en tus movimientos. Renombrar o eliminar afecta a todos los movimientos que la usan.')}
          {tags.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: '#52525b' }}>Aún no usaste ninguna etiqueta.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tags.map(tag => {
                if (editingTag?.old === tag) {
                  return (
                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        autoFocus value={editingTag.val} maxLength={30}
                        onChange={e => setEditingTag({ old: tag, val: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') { onRenameTag(tag, editingTag.val); setEditingTag(null) } if (e.key === 'Escape') setEditingTag(null) }}
                        style={{ width: '130px', padding: '5px 9px', fontSize: '12px' }}
                      />
                      <button onClick={() => { onRenameTag(tag, editingTag.val); setEditingTag(null) }} title="Guardar" style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#3ecf8e', color: '#09271b', fontSize: '13px' }}>✓</button>
                      <button onClick={() => setEditingTag(null)} title="Cancelar" style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#141417', border: '1px solid #26262b', color: '#71717a', fontSize: '13px' }}>✕</button>
                    </span>
                  )
                }
                if (confirmDelTag === tag) {
                  return (
                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'rgba(240,113,106,.08)', border: '1px solid rgba(240,113,106,.3)', borderRadius: '99px' }}>
                      <span style={{ fontSize: '12px', color: '#f0716a' }}>¿Borrar #{tag}?</span>
                      <button onClick={() => { onDeleteTag(tag); setConfirmDelTag(null) }} style={{ fontSize: '12px', color: '#f0716a', fontWeight: 600 }}>Sí</button>
                      <button onClick={() => setConfirmDelTag(null)} style={{ fontSize: '12px', color: '#71717a' }}>No</button>
                    </span>
                  )
                }
                return (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #26262b', borderRadius: '99px', overflow: 'hidden', background: '#141417' }}>
                    <span style={{ padding: '4px 4px 4px 11px', fontSize: '12.5px', color: '#d4d4d8' }}>#{tag}</span>
                    <button onClick={() => setEditingTag({ old: tag, val: tag })} title="Renombrar" style={{ padding: '4px 4px', color: '#71717a', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>
                      <Icon name="pencil" size={12} />
                    </button>
                    <button onClick={() => setConfirmDelTag(tag)} title="Eliminar de todos" style={{ padding: '4px 9px 4px 4px', color: '#52525b', display: 'flex' }} onMouseEnter={e => (e.currentTarget.style.color = '#f0716a')} onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>
                      <Icon name="trash" size={12} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Data management */}
        <div style={card}>
          {sectionTitle('Gestión de datos', 'Tus datos se sincronizan en la nube (Supabase).')}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleExport} style={btnGhost}><Icon name="download" size={14} /> Exportar JSON</button>
            <label style={{ ...btnGhost, cursor: 'pointer' }}>
              <Icon name="upload" size={14} /> Importar
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none', width: 'auto' }} />
            </label>
            <button onClick={handleClear} style={btnDanger}><Icon name="trash" size={14} /> {clearConfirm ? '¿Confirmar borrar todo?' : 'Borrar todo'}</button>
            {clearConfirm && <button onClick={() => setClearConfirm(false)} style={btnGhost}>Cancelar</button>}
          </div>
          {importStatus && <div style={{ fontSize: '12px', color: importStatus.startsWith('✓') ? '#3ecf8e' : '#f0716a', marginTop: '12px' }}>{importStatus}</div>}
        </div>

        {/* Info */}
        <div style={card}>
          {sectionTitle('Información')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            {[['Versión', '1.3.0'], ['Tecnología', 'React 19 + Vite + TypeScript'], ['Base de datos', 'Supabase (PostgreSQL)'], ['Monedas', 'USD · VES'], ['Tasa en vivo', 've.dolarapi.com']].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#71717a' }}>{label}</span>
                <span className="font-mono" style={{ color: '#d4d4d8' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Cerrar sesión</div>
              <div style={{ fontSize: '12.5px', color: '#71717a', marginTop: '4px' }}>Salir de tu cuenta en este dispositivo</div>
            </div>
            <button onClick={onSignOut} style={btnGhost}><Icon name="logout" size={14} /> Cerrar sesión</button>
          </div>
        </div>
      </div>
    </div>
  )
}
