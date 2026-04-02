import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, SESSION_TYPES, REACTIONS } from '../lib/supabase'
import type { Session, Response } from '../lib/supabase'
import Credit from '../components/Credit'

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
  const allCats = [...new Set(responses.map(r => r.category).filter(Boolean))]
  let filtered = filter ? responses.filter(r => r.category === filter) : responses
  if (sort === 'top') filtered = [...filtered].sort((a, b) => totalReactions(b) - totalReactions(a))

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }} className="animate-in">
        <p className="wordmark">Whi<span>spr</span></p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Admin view</p>
      </div>

      {/* Session info + share */}
      <div className="card animate-in-d1" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>{typeInfo?.icon}</span>
          <div>
            <span className={`tag ${typeInfo?.tagColor}`} style={{ marginBottom: '4px', display: 'inline-flex' }}>{typeInfo?.label}</span>
            <p style={{ fontWeight: 500, fontSize: '1rem' }}>{session?.title}</p>
            {session?.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '3px' }}>{session.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontSize: '0.875rem', fontWeight: 500 }}>
            {responses.length} response{responses.length !== 1 ? 's' : ''}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={fetchResponses}>↻ Refresh</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Share link with your group:</p>
        <div className="link-box">
          <span className="link-text">{window.location.origin}/s/{id}</span>
          <button className="btn btn-sm" onClick={copyLink}>{copyMsg || 'Copy'}</button>
        </div>
      </div>

      {/* Filters + sort */}
      {responses.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
        <div key={r.id} className="card animate-in" style={{ animationDelay: `${i * 0.04}s`, marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            {r.category && r.category !== 'General'
              ? <span className="tag tag-gray">{r.category}</span>
              : <span />}
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</span>
          </div>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>{r.text}</p>

          {/* Reactions summary */}
          {Object.keys(r.reactions ?? {}).length > 0 && (
            <div className="reactions" style={{ marginTop: '10px' }}>
              {REACTIONS.filter(e => (r.reactions?.[e] ?? 0) > 0).map(emoji => (
                <span key={emoji} className="react-btn" style={{ cursor: 'default' }}>
                  {emoji} {r.reactions[emoji]}
                </span>
              ))}
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
              <button className="btn btn-xs btn-danger" onClick={() => deleteResponse(r.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}

      <Credit />
    </div>
  )
}
