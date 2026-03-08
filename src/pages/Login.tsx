// Login / Sign-up page — email + password auth via Supabase
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
            CENTAVOS
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
