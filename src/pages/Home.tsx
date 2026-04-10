import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { SESSION_TYPES } from '../lib/supabase'
import type { SessionType } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import InstallPrompt from '../components/InstallPrompt'
import Credit from '../components/Credit'

const TYPE_COLORS: Record<SessionType, string> = {
  ideas:       '#3B82F6',
  suggestions: '#10B981',
  discussion:  '#8B5CF6',
  poll:        '#F59E0B',
  ama:         '#6B7280',
  feedback:    '#EC4899',
  catchup:     '#6366F1',
  survey:      '#0EA5E9',
}

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', zIndex: 1 }}>

      {/* ── Topbar ── */}
      <header className="topbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="wordmark">Whi<em>spr</em></span>
        </Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          {user
            ? <Link to="/dashboard" className="btn btn-sm">My sessions</Link>
            : <Link to="/login" className="btn btn-sm btn-primary">Sign in</Link>
          }
        </div>
      </header>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '0 var(--page-pad)' }}>

        {/* ── Hero ── */}
        <div className="animate-in" style={{ textAlign: 'center', padding: '3.5rem 0 2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-soft)', border: '1px solid rgba(79,70,229,.18)', borderRadius: '20px', padding: '4px 14px', marginBottom: '1.25rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            <span style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--accent-text)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Anonymous · Real-time · Private</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Collect honest feedback,<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>anonymously.</em>
          </h1>

          <p style={{ fontSize: 'clamp(.9rem, 2.5vw, 1.0625rem)', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Create a session, share the link in your WhatsApp group — members respond with no name, no number, no account needed.
          </p>

          {!user && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '11px 28px', fontSize: '0.9375rem' }}>Get started free →</Link>
              <Link to="/create/ideas" className="btn" style={{ padding: '11px 28px', fontSize: '0.9375rem' }}>Try without account</Link>
            </div>
          )}
        </div>

        <InstallPrompt />

        {/* ── Session type grid ── */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-faint)', marginBottom: '1rem', textAlign: 'center' }}>
            Choose a session type to get started
          </p>

          <div className="session-grid">
            {(Object.entries(SESSION_TYPES) as [SessionType, typeof SESSION_TYPES[SessionType]][]).map(([key, t], i) => (
              <Link
                key={key}
                to={`/create/${key}`}
                className="session-type-card animate-in"
                style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}
              >
                {/* Color accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: TYPE_COLORS[key], borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', opacity: 0.7 }} />
                <span className="st-icon">{t.icon}</span>
                <span className="st-label">{t.label}</span>
                <span className="st-desc">{t.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="card animate-in-d3" style={{ marginBottom: '3rem' }}>
          <p className="section-label" style={{ marginBottom: '1.25rem' }}>How it works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem' }}>
            {[
              { step: '01', title: 'Pick a session type', desc: 'Choose from 8 formats — polls, surveys, chat and more.' },
              { step: '02', title: 'Share the link', desc: 'Paste it in your WhatsApp group, status, or anywhere.' },
              { step: '03', title: 'Collect responses', desc: 'Members respond anonymously. You see everything live.' },
            ].map(s => (
              <div key={s.step}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '6px', fontStyle: 'italic' }}>{s.step}</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{s.title}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Credit />
    </div>
  )
}
