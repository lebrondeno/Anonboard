import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES } from '../lib/supabase'
import type { Session } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Credit from '../components/Credit'

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
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // fetch response counts for each session
    const counts = await Promise.all(
      data.map(s =>
        supabase.from('responses').select('id', { count: 'exact', head: true }).eq('session_id', s.id)
      )
    )
    setSessions(data.map((s, i) => ({ ...s, response_count: counts[i].count ?? 0 })))
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

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

  if (authLoading || loading) return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner" />
    </div>
  )

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }} className="animate-in">
        <div>
          <p className="wordmark">Whi<span>spr</span></p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {user?.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Link to="/" className="btn btn-sm btn-green">+ New session</Link>
          <button className="btn btn-sm btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }} className="animate-in-d1">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sessions</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 500 }}>{sessions.length}</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total responses</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 500 }}>{sessions.reduce((a, s) => a + s.response_count, 0)}</p>
        </div>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 && !loading && (
        <div className="empty-state animate-in-d2">
          <p style={{ fontSize: '2rem' }}>📭</p>
          <p>No sessions yet.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
            Create your first session →
          </Link>
        </div>
      )}

      <div className="animate-in-d2">
        {sessions.map((s, i) => {
          const typeInfo = SESSION_TYPES[s.type]
          return (
            <div key={s.id} className="card" style={{ marginBottom: '10px', animationDelay: `${i * 0.04}s` }}>
              {/* Cover image thumbnail */}
              {s.cover_image && (
                <img
                  src={s.cover_image}
                  alt=""
                  style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}
                />
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: '2px' }}>{typeInfo?.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span className={`tag ${typeInfo?.tagColor}`}>{typeInfo?.label}</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{timeAgo(s.created_at)}</span>
                  </div>
                  <p style={{ fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.35, marginBottom: '2px' }}>{s.title}</p>
                  {s.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.description}
                    </p>
                  )}
                </div>
                {/* Response count badge */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 500, lineHeight: 1 }}>{s.response_count}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>response{s.response_count !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="divider" style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/admin/${s.id}`} className="btn btn-sm btn-primary">View responses</Link>
                <button
                  className="btn btn-sm"
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${s.id}`) }}
                >
                  Copy link
                </button>
                <button className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }} onClick={() => deleteSession(s.id)}>
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Credit />
    </div>
  )
}
