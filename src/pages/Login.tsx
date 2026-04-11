import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Credit from '../components/Credit'
import ThemeToggle from '../components/ThemeToggle'

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
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
      if (err) { setError(err.message); setLoading(false); return }
      setSuccess('Reset link sent — check your email.')
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ justifyContent: 'center', maxWidth: '420px' }}>
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <p className="wordmark" style={{ display: 'block', textAlign: 'center', fontSize: '2.25rem', fontStyle: 'italic' }}>Whispr</p>
        </Link>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
          {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your admin account' : 'Reset your password'}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}><ThemeToggle /></div>
      <div className="card-glow animate-in-d1">
        {mode !== 'reset' && (
          <div className="tab-bar" style={{ marginBottom: '20px' }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button key={m} className={`tab-btn${mode === m ? ' active' : ''}`}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}>
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="email" />
          </div>
          {mode !== 'reset' && (
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '12px' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--red-text)', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: 'var(--green-soft)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '12px' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--green-text)', lineHeight: 1.5 }}>{success}</p>
          </div>
        )}

        <button className="btn btn-primary btn-full" style={{ marginTop: '16px' }} onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner spinner-white" /> Please wait...</>
            : mode === 'login' ? 'Log in →' : mode === 'signup' ? 'Create account →' : 'Send reset link'}
        </button>

        {mode === 'login' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
            Forgot password?{' '}
            <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Reset it</button>
          </p>
        )}
        {mode === 'reset' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>← Back to login</button>
          </p>
        )}
      </div>
      <Credit />
    </div>
  )
}
