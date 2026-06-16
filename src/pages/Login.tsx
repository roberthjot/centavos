// Login / Sign-up — redesigned 2026. Two columns: form (left) + brand panel
// (right). Supabase email/password + Google OAuth preserved.
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: '#09090b', lineHeight: 1 }}>¢</span>
      </div>
      <span style={{ fontWeight: 600, fontSize: '18px', letterSpacing: '-.02em' }}>centavos</span>
    </div>
  )
}

export function Login() {
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) setError(error.message)
      else setSuccess('¡Cuenta creada! Revisa tu correo para confirmar y luego inicia sesión.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) { setError(error.message); setLoading(false) }
  }

  const inputLabel = (t: string) => <label style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '6px', display: 'block' }}>{t}</label>

  const form = (
    <div style={{ width: '100%', maxWidth: '360px' }}>
      <Wordmark />
      <h1 style={{ margin: '40px 0 6px', fontSize: '24px', fontWeight: 600, letterSpacing: '-.02em' }}>
        {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </h1>
      <p style={{ margin: '0 0 28px', fontSize: '13px', color: '#71717a' }}>
        {mode === 'login' ? 'Accedé a tus finanzas en USD y VES.' : 'Empezá a controlar tu dinero en dos monedas.'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mode === 'signup' && (
          <div>
            {inputLabel('Nombre')}
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" />
          </div>
        )}
        <div>
          {inputLabel('Correo electrónico')}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required autoComplete="email" />
        </div>
        <div>
          {inputLabel('Contraseña')}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} />
        </div>

        {error && <div style={{ fontSize: '12px', color: '#f0716a', background: 'rgba(240,113,106,.1)', border: '1px solid rgba(240,113,106,.3)', borderRadius: '8px', padding: '10px 12px' }}>{error}</div>}
        {success && <div style={{ fontSize: '12px', color: '#3ecf8e', background: 'rgba(62,207,142,.1)', border: '1px solid rgba(62,207,142,.25)', borderRadius: '8px', padding: '10px 12px' }}>{success}</div>}

        <button type="submit" disabled={loading} style={{ marginTop: '4px', height: '42px', background: loading ? '#26487a' : '#3ecf8e', color: '#09271b', borderRadius: '9px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#19191d' }} />
        <span style={{ fontSize: '11px', color: '#52525b' }}>o</span>
        <div style={{ flex: 1, height: '1px', background: '#19191d' }} />
      </div>

      <button type="button" onClick={handleGoogle} disabled={loading} style={{ width: '100%', height: '42px', background: '#141417', color: '#fafafa', border: '1px solid #26262b', borderRadius: '9px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a3a40')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#26262b')}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continuar con Google
      </button>

      <div style={{ marginTop: '24px', fontSize: '13px', color: '#71717a' }}>
        {mode === 'login' ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }} style={{ color: '#3ecf8e', fontSize: '13px', fontWeight: 600 }}>
          {mode === 'login' ? 'Crear una' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  )

  // Brand panel (right) — only on desktop
  const brand = (
    <div style={{ flex: 1, position: 'relative', background: '#0c0c0e', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderLeft: '1px solid #19191d' }}>
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(62,207,142,.12) 0%, transparent 70%)' }} />
      <div style={{ position: 'relative', maxWidth: '420px', padding: '0 48px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.25 }}>
          Tu dinero en dólares y bolívares, claro y bajo control.
        </h2>
        <p style={{ margin: '16px 0 32px', fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6 }}>
          Registra ingresos y gastos en dos monedas, mira tu patrimonio neto y planifica tus metas — todo en un solo lugar.
        </p>
        {/* Mini patrimonio preview */}
        <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '14px', padding: '20px', maxWidth: '300px' }}>
          <div style={{ fontSize: '11.5px', color: '#71717a', marginBottom: '8px' }}>Patrimonio neto</div>
          <div className="font-mono" style={{ fontSize: '30px', fontWeight: 600, letterSpacing: '-.03em' }}>$5.213</div>
          <div style={{ display: 'flex', gap: '3px', height: '6px', borderRadius: '99px', overflow: 'hidden', margin: '14px 0 10px' }}>
            <div style={{ flex: 93, background: '#3ecf8e', borderRadius: '99px' }} />
            <div style={{ flex: 7, background: '#cbb389', borderRadius: '99px' }} />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontSize: '11px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ecf8e' }} />USD 93%</span>
            <span style={{ fontSize: '11px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbb389' }} />VES 7%</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', background: '#09090b' }}>
      <div style={{ flex: isMobile ? 1 : '0 0 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        {form}
      </div>
      {!isMobile && brand}
    </div>
  )
}
