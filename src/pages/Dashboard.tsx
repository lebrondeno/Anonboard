import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES } from '../lib/supabase'
import type { Session } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Credit from '../components/Credit'
import ThemeToggle from '../components/ThemeToggle'

type SessionWithCount = Session & { response_count: number }

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    fetchSessions()
  }, [user, authLoading])

  async function fetchSessions() {
    const { data } = await supabase.from('sessions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
    if (!data) { setLoading(false); return }
    const counts = await Promise.all(data.map(s => supabase.from('responses').select('id', { count: 'exact', head: true }).eq('session_id', s.id)))
    setSessions(data.map((s, i) => ({ ...s, response_count: counts[i].count ?? 0 })))
    setLoading(false)
  }

  async function signOut() { await supabase.auth.signOut(); navigate('/login') }

  async function deleteSession(id: string) {
    if (!confirm('Delete this session and all its responses?')) return
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  function timeAgo(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  const totalResponses = sessions.reduce((a, s) => a + s.response_count, 0)

  if (authLoading || loading) return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', zIndex: 1 }}>
      <header className="topbar">
        <div>
          <p className="wordmark">Whispr</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          <ThemeToggle />
          <Link to="/" className="btn btn-sm btn-green">+ New</Link>
          <button className="btn btn-sm btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '2rem var(--page-pad) 6rem' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }} className="animate-in-d1">
        <div className="stat-card">
          <p className="stat-num">{sessions.length}</p>
          <p className="stat-label">Sessions</p>
        </div>
        <div className="stat-card">
          <p className="stat-num">{totalResponses}</p>
          <p className="stat-label">Total responses</p>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="empty-state animate-in-d2">
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</p>
          <p>No sessions yet.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Create your first session →</Link>
        </div>
      )}

      <div className="dashboard-grid animate-in-d2">
        {sessions.map((s, i) => {
          const typeInfo = SESSION_TYPES[s.type]
          return (
            <div key={s.id} className="card" style={{ transition: 'all 0.2s', animationDelay: `${i * 0.05}s` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              {s.cover_image && (
                <img src={s.cover_image} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }} />
              )}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: '2px' }}>{typeInfo?.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span className={`tag ${typeInfo?.color}`}>{typeInfo?.label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(s.created_at)}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3, letterSpacing: '-0.02em' }}>{s.title}</p>
                  {s.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', background: 'linear-gradient(135deg, var(--text-primary), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>{s.response_count}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>resp.</p>
                </div>
              </div>

              <div className="divider" style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/admin/${s.id}`} className="btn btn-sm btn-primary">View responses</Link>
                <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${s.type === 'catchup' ? 'chat' : s.type === 'survey' ? 'survey' : 's'}/${s.id}`); }}>Copy link</button>
                <button className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }} onClick={() => deleteSession(s.id)}>Delete</button>
              </div>
            </div>
          )
        })}
      </div>

      </main>
      <Credit />
    </div>
  )
}
