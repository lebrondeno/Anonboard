import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES, REACTIONS } from '../lib/supabase'
import type { Session, Response } from '../lib/supabase'
import Credit from '../components/Credit'
import ThemeToggle from '../components/ThemeToggle'

export default function Admin() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<'newest' | 'top'>('newest')
  const [loading, setLoading] = useState(true)
  const [copyMsg, setCopyMsg] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem(`admin_${id}`)
    supabase.from('sessions').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { navigate('/'); return }
      const s = data as Session
      setSession(s)
      if (token && token === s.admin_token) setIsAdmin(true)
    })
    fetchResponses()
  }, [id])

  const fetchResponses = useCallback(async () => {
    if (!id) return
    const { data } = await supabase.from('responses').select('*').eq('session_id', id).order('created_at', { ascending: false })
    setResponses((data as Response[]) ?? [])
    setLoading(false)
  }, [id])

  async function deleteResponse(rid: string) {
    if (!confirm('Delete this response?')) return
    await supabase.from('responses').delete().eq('id', rid)
    setResponses(prev => prev.filter(r => r.id !== rid))
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/s/${id}`).catch(() => {})
    setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000)
  }

  function totalReactions(r: Response) {
    return Object.values(r.reactions ?? {}).reduce((a, b) => a + b, 0)
  }

  function timeAgo(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  const typeInfo = session ? SESSION_TYPES[session.type] : null
  const isPoll = session?.type === 'poll'

  // Poll tallies
  const pollTotals: Record<string, number> = {}
  if (isPoll && session?.poll_options) {
    session.poll_options.forEach(o => { pollTotals[o] = 0 })
    responses.forEach(r => { if (r.poll_choice) pollTotals[r.poll_choice] = (pollTotals[r.poll_choice] ?? 0) + 1 })
  }
  const totalVotes = Object.values(pollTotals).reduce((a, b) => a + b, 0)
  const topOption = Object.entries(pollTotals).sort((a, b) => b[1] - a[1])[0]

  const allCats = [...new Set(responses.map(r => r.category).filter(c => c && c !== 'poll'))]
  let filtered = filter ? responses.filter(r => r.category === filter) : responses.filter(r => r.category !== 'poll' || isPoll)
  if (!isPoll) filtered = filtered.filter(r => r.poll_choice === '' || r.poll_choice === null || r.poll_choice === undefined)
  if (sort === 'top') filtered = [...filtered].sort((a, b) => totalReactions(b) - totalReactions(a))

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }} className="animate-in">
        <div>
          <p className="wordmark">Whispr</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>Admin view</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link to="/dashboard" className="btn btn-sm btn-ghost">← Dashboard</Link>
        </div>
      </div>

      {/* Session card */}
      <div className="card-glow animate-in-d1" style={{ marginBottom: '14px' }}>
        {session?.cover_image && (
          <img src={session.cover_image} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '14px' }} />
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.6rem' }}>{typeInfo?.icon}</span>
          <div style={{ flex: 1 }}>
            <span className={`tag ${typeInfo?.color}`} style={{ marginBottom: '6px', display: 'inline-flex' }}>{typeInfo?.label}</span>
            <p style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{session?.title}</p>
            {session?.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{session.description}</p>}
          </div>
        </div>

        <div className="divider" />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div className="stat-card">
            <p className="stat-num">{isPoll ? totalVotes : responses.length}</p>
            <p className="stat-label">{isPoll ? 'Votes' : 'Responses'}</p>
          </div>
          <div className="stat-card">
            {isPoll && topOption
              ? <><p className="stat-num" style={{ fontSize: '1rem', fontWeight: 700, WebkitTextFillColor: 'unset', color: 'var(--accent-text)' }}>{topOption[0]}</p><p className="stat-label">Leading option</p></>
              : <><p className="stat-num">{responses.reduce((a, r) => a + totalReactions(r), 0)}</p><p className="stat-label">Total reactions</p></>
            }
          </div>
        </div>

        {/* Share link */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Share with your group</p>
        <div className="link-box">
          <span className="link-text">{window.location.origin}/s/{id}</span>
          <button className="btn btn-sm" onClick={copyLink}>{copyMsg || 'Copy link'}</button>
        </div>
      </div>

      {/* ── POLL RESULTS ── */}
      {isPoll && session?.poll_options && (
        <div className="card animate-in-d2" style={{ marginBottom: '14px' }}>
          <p className="section-label" style={{ marginBottom: '12px' }}>Poll results</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {session.poll_options
              .sort((a, b) => (pollTotals[b] ?? 0) - (pollTotals[a] ?? 0))
              .map((option) => {
                const count = pollTotals[option] ?? 0
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                const isLeading = topOption?.[0] === option && totalVotes > 0
                return (
                  <div key={option} style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg2)', border: `2px solid ${isLeading ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: isLeading ? 'linear-gradient(90deg, rgba(124,111,247,0.2), rgba(124,111,247,0.05))' : 'rgba(255,255,255,0.03)', transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)', borderRadius: 'var(--radius-md)' }} />
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isLeading && <span style={{ fontSize: '1rem' }}>🏆</span>}
                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: isLeading ? 'var(--accent-text)' : 'var(--text-primary)' }}>{option}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count} vote{count !== 1 ? 's' : ''}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isLeading ? 'var(--accent-text)' : 'var(--text-secondary)', minWidth: '36px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── TEXT RESPONSES ── */}
      {!isPoll && (
        <>
          {responses.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className={`btn btn-xs${!filter ? ' btn-primary' : ''}`} onClick={() => setFilter('')}>All</button>
              {allCats.map(c => (
                <button key={c} className={`btn btn-xs${filter === c ? ' btn-primary' : ''}`} onClick={() => setFilter(c)}>{c}</button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <button className={`btn btn-xs${sort === 'newest' ? ' btn-primary' : ''}`} onClick={() => setSort('newest')}>Newest</button>
                <button className={`btn btn-xs${sort === 'top' ? ' btn-primary' : ''}`} onClick={() => setSort('top')}>Top</button>
              </div>
            </div>
          )}

          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <p style={{ fontSize: '2rem' }}>💬</p>
              <p>No responses yet. Share the link with your group!</p>
            </div>
          )}

          {filtered.map((r, i) => (
            <div key={r.id} className="response-card" style={{ animationDelay: `${i * 0.04}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                {r.category && r.category !== 'General' ? <span className="tag tag-gray">{r.category}</span> : <span />}
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.65 }}>{r.text}</p>
              {Object.keys(r.reactions ?? {}).length > 0 && (
                <div className="reactions" style={{ marginTop: '10px' }}>
                  {REACTIONS.filter(e => (r.reactions?.[e] ?? 0) > 0).map(emoji => (
                    <span key={emoji} className="react-btn" style={{ cursor: 'default' }}>{emoji} {r.reactions[emoji]}</span>
                  ))}
                </div>
              )}
              {isAdmin && (
                <div style={{ marginTop: '10px' }}>
                  <button className="btn btn-xs btn-danger" onClick={() => deleteResponse(r.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <Credit />
    </div>
  )
}
