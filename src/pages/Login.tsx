// Login / Sign-up page — email + password + Google OAuth via Supabase
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('¡Cuenta creada! Revisa tu correo para confirmar y luego inicia sesión.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setLoading(false) }
    // On success, Supabase redirects to Google — no need to setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#080818',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '32px',
            color: '#8b5cf6',
            letterSpacing: '0.05em',
          }}>
            🪙 CENTAVOS
          </div>
          <div style={{ fontSize: '13px', color: '#6b6b9e', marginTop: '4px' }}>
            Finanzas personales · USD &amp; VES
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#0c0c1e',
          border: '1px solid #18183a',
          borderRadius: '14px',
          padding: '32px',
        }}>
          <h2 style={{
            margin: '0 0 24px 0',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '18px',
            color: '#eeeef8',
          }}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#6b6b9e', display: 'block', marginBottom: '6px' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
              />
            </div>

            {/* Error / success messages */}
            {error && (
              <div style={{
                fontSize: '12px', color: '#f43f5e',
                background: '#f43f5e15', border: '1px solid #f43f5e40',
                borderRadius: '6px', padding: '10px 12px',
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                fontSize: '12px', color: '#10d97a',
                background: '#10d97a15', border: '1px solid #10d97a40',
                borderRadius: '6px', padding: '10px 12px',
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                padding: '11px',
                background: loading ? '#6b6b9e' : '#8b5cf6',
                color: '#eeeef8',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#18183a' }} />
            <span style={{ fontSize: '11px', color: '#6b6b9e', whiteSpace: 'nowrap' }}>o continúa con</span>
            <div style={{ flex: 1, height: '1px', background: '#18183a' }} />
          </div>

          {/* Google OAuth button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              background: '#131328',
              color: '#eeeef8',
              border: '1px solid #18183a',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#8b5cf6' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#18183a' }}
          >
            {/* Google icon SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Toggle mode */}
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#6b6b9e' }}>
            {mode === 'login' ? (
              <>
                ¿Sin cuenta?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Crear una
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
