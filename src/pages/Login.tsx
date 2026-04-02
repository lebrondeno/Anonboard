import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Credit from '../components/Credit'

type Mode = 'login' | 'signup' | 'reset'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    if (!email.trim()) { setError('Please enter your email.'); return }
    if (mode !== 'reset' && !password.trim()) { setError('Please enter your password.'); return }
    setLoading(true); setError(''); setSuccess('')

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      navigate('/dashboard')

    } else if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      setSuccess('Account created! Check your email to confirm, then log in.')
      setMode('login')

    } else {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (err) { setError(err.message); setLoading(false); return }
      setSuccess('Password reset link sent — check your email.')
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ justifyContent: 'center', maxWidth: '420px' }}>
      <div className="animate-in" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <p className="wordmark" style={{ justifyContent: 'center', display: 'flex' }}>Whi<span>spr</span></p>
        </Link>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          {mode === 'login' ? 'Sign in to your admin account' : mode === 'signup' ? 'Create your admin account' : 'Reset your password'}
        </p>
      </div>

      <div className="card animate-in-d1">
        {/* Tab switcher */}
        {mode !== 'reset' && (
          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '3px', marginBottom: '20px', gap: '3px' }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500,
                  background: mode === m ? 'var(--surface)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(185,28,28,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '12px' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--red)' }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: 'var(--green-soft)', border: '1px solid rgba(30,122,74,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '12px' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--green)' }}>{success}</p>
          </div>
        )}

        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: '16px' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner spinner-white" /> Please wait...</>
            : mode === 'login' ? 'Log in →' : mode === 'signup' ? 'Create account →' : 'Send reset link'}
        </button>

        {mode === 'login' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
            Forgot password?{' '}
            <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              Reset it
            </button>
          </p>
        )}
        {mode === 'reset' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              ← Back to login
            </button>
          </p>
        )}
      </div>

      <Credit />
    </div>
  )
}
