import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES } from '../lib/supabase'
import type { Session, Response, ChatMessage, SurveyQuestion } from '../lib/supabase'
import { exportSession } from '../lib/exportExcel'
import WAStatusCard from '../components/WAStatusCard'
import { IconPill } from '../components/SessionIcon'
import AdminNote from '../components/AdminNote'
import ResponseChart from '../components/ResponseChart'
import QRModal from '../components/QRModal'
import ShareModal from '../components/ShareModal'
import { requestNotificationPermission, notifyNewResponse } from '../lib/notifications'
import Credit from '../components/Credit'
import { useAuth } from '../lib/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

export default function Admin() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<'newest' | 'top'>('newest')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [showWACard, setShowWACard] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem(`admin_${id}`)
    supabase.from('sessions').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { navigate('/'); return }
      const s = data as Session
      setSession(s)
      // Admin if: localStorage token matches OR logged-in user owns the session
      const tokenMatch = token && token === s.admin_token
      const ownerMatch = user && user.id === s.user_id
      if (tokenMatch || ownerMatch) setIsAdmin(true)
    })
    fetchData()
    // Request notification permission
    requestNotificationPermission()
  }, [id])

  const fetchData = useCallback(async () => {
    if (!id) return
    const [{ data: r }, { data: m }] = await Promise.all([
      supabase.from('responses').select('*').eq('session_id', id).order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').eq('session_id', id).order('created_at', { ascending: true }),
    ])
    const newResponses = (r as Response[]) ?? []
    const prevCount = responses.length
    setResponses(newResponses)
    setMessages((m as ChatMessage[]) ?? [])
    setLoading(false)
    // Notify if new responses since last fetch
    if (prevCount > 0 && newResponses.length > prevCount && session) {
      notifyNewResponse(session.title, newResponses.length)
    }
  }, [id])

  async function deleteResponse(rid: string) {
    if (!confirm('Remove this one?')) return
    await supabase.from('responses').delete().eq('id', rid)
    setResponses(prev => prev.filter(r => r.id !== rid))
  }

  async function deleteMessage(mid: string) {
    if (!confirm('Remove this message?')) return
    await supabase.from('chat_messages').delete().eq('id', mid)
    setMessages(prev => prev.filter(m => m.id !== mid))
  }

  async function pinMessage(msg: ChatMessage) {
    await supabase.from('chat_messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id)
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m))
  }



  async function toggleClose() {
    if (!session) return
    const newState = !session.is_closed
    await supabase.from('sessions').update({ is_closed: newState }).eq('id', id)
    setSession(prev => prev ? { ...prev, is_closed: newState } : prev)
  }

  async function handleExport() {
    if (!session) return
    setExporting(true)
    try { exportSession(session, responses, messages) }
    catch (e) { alert('Export failed: ' + e) }
    finally { setTimeout(() => setExporting(false), 1000) }
  }

  function totalReactions(r: Response) { return Object.values(r.reactions ?? {}).reduce((a, b) => a + (b as number), 0) }
  function timeAgo(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  const typeInfo = session ? SESSION_TYPES[session.type] : null
  const isPoll = session?.type === 'poll'
  const isCatchUp = session?.type === 'catchup'
  const isSurvey = session?.type === 'survey'

  // Poll tallies
  const pollTotals: Record<string, number> = {}
  if (isPoll && session?.poll_options) {
    session.poll_options.forEach(o => { pollTotals[o] = 0 })
    responses.forEach(r => { if (r.poll_choice) pollTotals[r.poll_choice] = (pollTotals[r.poll_choice] ?? 0) + 1 })
  }
  const totalVotes = Object.values(pollTotals).reduce((a, b) => a + b, 0)
  const topOption = Object.entries(pollTotals).sort((a, b) => b[1] - a[1])[0]

  // Survey tallies per question
  const surveyQuestions: SurveyQuestion[] = session?.survey_questions ?? []

  const allCats = [...new Set(responses.map(r => r.category).filter(c => c && c !== 'poll' && c !== 'survey'))]
  let filtered = filter ? responses.filter(r => r.category === filter) : responses.filter(r => !['poll', 'survey'].includes(r.category))
  if (search.trim()) filtered = filtered.filter(r => r.text.toLowerCase().includes(search.toLowerCase()))
  if (sort === 'top') filtered = [...filtered].sort((a, b) => totalReactions(b) - totalReactions(a))

  const shareUrl = `${window.location.origin}/${isCatchUp ? 'chat' : isSurvey ? 'survey' : 's'}/${id}`
  const totalCount = isCatchUp ? messages.length : responses.length

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }} className="animate-in">
        <div>
          <p className="wordmark">Whi<em>spr</em></p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>Admin view</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link to="/dashboard" className="btn btn-sm btn-ghost">← Dashboard</Link>
        </div>
      </div>

      {/* Session card */}
      <div className="card-accent animate-in-d1" style={{ marginBottom: '14px' }}>
        {session?.cover_image && (
          <img src={session.cover_image} alt="" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '14px', boxShadow: 'var(--shadow-sm)' }} />
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <IconPill type={(session?.type ?? 'openfloor') as any} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'6px' }}>
              <span className={`tag ${typeInfo?.color}`}>{typeInfo?.label}</span>
              {session?.framing_mode && <span className="tag tag-gray">{session.framing_mode}</span>}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.03em', lineHeight: 1.2, color: 'var(--text-primary)' }}>{session?.title}</p>
            {session?.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>{session.description}</p>}
          </div>
        </div>

        <div className="divider" />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div className="stat-card">
            <p className="stat-num">{totalCount}</p>
            <p className="stat-label">{isCatchUp ? 'Messages' : isSurvey ? 'Submissions' : isPoll ? 'Votes' : 'Responses'}</p>
          </div>
          <div className="stat-card">
            {isPoll && topOption
              ? <><p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>{topOption[0]}</p><p className="stat-label">Leading option</p></>
              : isCatchUp
              ? <><p className="stat-num">{messages.filter(m => m.is_pinned).length}</p><p className="stat-label">Pinned messages</p></>
              : <><p className="stat-num">{responses.reduce((a, r) => a + totalReactions(r), 0)}</p><p className="stat-label">Total reactions</p></>
            }
          </div>
        </div>

        {/* Share + actions */}
        {/* Response over time chart */}
        {!isCatchUp && !isPoll && responses.length > 0 && (
          <div style={{ marginBottom: '14px', padding: '14px 16px', background: 'var(--bg2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <ResponseChart dates={responses.map(r => r.created_at)} height={72} />
          </div>
        )}

        {session?.is_closed && (
          <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: '12px', fontSize: '.84rem', color: 'var(--red-text)', fontWeight: 500 }}>
            🔒 This session is closed — members cannot submit new responses.
          </div>
        )}
        <p className="section-label" style={{ marginBottom: '8px' }}>Share with your group</p>
        <div className="link-box" style={{ marginBottom: '10px' }}>
          <span className="link-text">{shareUrl}</span>
          <button className="btn btn-sm" onClick={() => setShowShare(true)}>⬆ Share</button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isCatchUp && (
            <Link to={`/chat/${id}?host=1`} className="btn btn-sm btn-primary">
              👑 Join as Host
            </Link>
          )}
          <button className="btn btn-sm" onClick={() => setShowWACard(true)} style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}>📲 Status Card</button>
          <button className="btn btn-sm btn-green" onClick={handleExport} disabled={exporting}>
            {exporting ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--green)' }} /> Exporting...</> : '⬇ Export Excel'}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowQR(true)}>⬛ QR Code</button>
          <button className="btn btn-sm btn-ghost" onClick={fetchData}>↻ Refresh</button>
          {isAdmin && (
            <button
              className={`btn btn-sm ${session?.is_closed ? 'btn-green' : 'btn-danger'}`}
              onClick={toggleClose}
              title={session?.is_closed ? 'Reopen session' : 'Close session — stops new responses'}
            >
              {session?.is_closed ? '🔓 Reopen' : '🔒 Close'}
            </button>
          )}
        </div>
      </div>

      {/* ── CATCHUP: pinned + all messages ── */}
      {isCatchUp && (
        <>
          {messages.filter(m => m.is_pinned).length > 0 && (
            <>
              <p className="section-label">📌 Pinned</p>
              {messages.filter(m => m.is_pinned).map(m => (
                <div key={m.id} className="response-card" style={{ borderLeft: '3px solid var(--accent)', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.anon_color }} />
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: m.anon_color }}>{m.anon_name}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(m.created_at)}</span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{m.text.startsWith('IMG_STICKER:') ? '🖼️ Image sticker' : m.text}</p>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button className="btn btn-xs" onClick={() => pinMessage(m)}>Unpin</button>
                      <button className="btn btn-xs btn-danger" onClick={() => deleteMessage(m.id)}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
              <div className="divider" />
            </>
          )}

          <p className="section-label">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}
          {!loading && messages.length === 0 && <div className="empty-state"><p style={{ fontSize: '2rem' }}>💬</p><p>No messages yet.</p></div>}
          {[...messages].reverse().map((m, i) => (
            <div key={m.id} className="response-card" style={{ animationDelay: `${i * 0.03}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.anon_color }} />
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: m.anon_color }}>{m.anon_name}</p>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(m.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{m.text.startsWith('IMG_STICKER:') ? '🖼️ Image sticker' : m.text}</p>
              {Object.keys(m.reactions ?? {}).filter(e => m.reactions[e] > 0).length > 0 && (
                <div className="reactions" style={{ marginTop: '8px' }}>
                  {Object.entries(m.reactions).filter(([,v]) => (v as number) > 0).map(([e, v]) => (
                    <span key={e} className="react-btn" style={{ cursor: 'default' }}>{e} {v as number}</span>
                  ))}
                </div>
              )}
              {isAdmin && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button className="btn btn-xs" onClick={() => pinMessage(m)}>{m.is_pinned ? 'Unpin' : '📌 Pin'}</button>
                  <button className="btn btn-xs btn-danger" onClick={() => deleteMessage(m.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── SURVEY results ── */}
      {isSurvey && (
        <>
          <p className="section-label">{responses.length} submission{responses.length !== 1 ? 's' : ''}</p>
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}
          {!loading && responses.length === 0 && <div className="empty-state"><p style={{ fontSize: '2rem' }}>📋</p><p>No submissions yet. Share the survey link!</p></div>}

          {surveyQuestions.map((q, qi) => {
            const answers = responses.map(r => r.survey_answers?.[q.id]).filter(Boolean)
            return (
              <div key={q.id} className="card" style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Q{qi + 1}</p>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.4 }}>{q.text}</p>

                {(q.type === 'short' || q.type === 'long') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {answers.length === 0 ? <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No answers yet</p>
                      : answers.map((a, i) => (
                        <div key={i} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', border: '1px solid var(--border)', lineHeight: 1.5 }}>{a}</div>
                      ))}
                  </div>
                )}

                {q.type === 'yesno' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['Yes', 'No'].map(opt => {
                      const count = answers.filter(a => a === opt).length
                      const pct = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0
                      return (
                        <div key={opt} style={{ flex: 1, background: 'var(--bg2)', border: `1.5px solid ${opt === 'Yes' ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.3)'}`, borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                          <p style={{ fontWeight: 700, fontSize: '1.25rem', color: opt === 'Yes' ? 'var(--green)' : 'var(--red)' }}>{pct}%</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt} · {count}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.type === 'choice' && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {q.options.map(opt => {
                      const count = answers.filter(a => a === opt).length
                      const pct = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0
                      const isTop = count === Math.max(...q.options!.map(o => answers.filter(a => a === o).length))
                      return (
                        <div key={opt} style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg2)', border: `1px solid ${isTop && count > 0 ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--accent-soft)', transition: 'width 0.6s ease' }} />
                          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: isTop && count > 0 ? 600 : 400, color: isTop && count > 0 ? 'var(--accent-text)' : 'var(--text-primary)' }}>{opt}</p>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: isTop && count > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>{pct}% · {count}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.type === 'rating' && (
                  <div>
                    {(() => {
                      const nums = answers.map(Number).filter(n => n > 0)
                      const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '—'
                      const dist = [1,2,3,4,5].map(n => ({ n, count: nums.filter(x => x === n).length }))
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--amber)', letterSpacing: '-0.03em' }}>{avg}</p>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>/ 5 · {nums.length} ratings</p>
                          </div>
                          {dist.reverse().map(({ n, count }) => {
                            const pct = nums.length > 0 ? Math.round((count / nums.length) * 100) : 0
                            return (
                              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '20px', textAlign: 'right', flexShrink: 0 }}>{n}★</p>
                                <div style={{ flex: 1, height: '8px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--amber)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                </div>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '28px', flexShrink: 0 }}>{count}</p>
                              </div>
                            )
                          })}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* ── POLL results ── */}
      {isPoll && session?.poll_options && (
        <div className="card animate-in-d2" style={{ marginBottom: '14px' }}>
          <p className="section-label" style={{ marginBottom: '12px' }}>Poll results</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {session.poll_options.sort((a, b) => (pollTotals[b] ?? 0) - (pollTotals[a] ?? 0)).map(option => {
              const count = pollTotals[option] ?? 0
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isLeading = topOption?.[0] === option && totalVotes > 0
              return (
                <div key={option} style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg2)', border: `1.5px solid ${isLeading ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '12px 16px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: isLeading ? 'var(--accent-soft)' : 'rgba(0,0,0,0.025)', transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)', borderRadius: 'var(--radius-md)' }} />
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isLeading && <span style={{ fontSize: '0.9rem' }}>🏆</span>}
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: isLeading ? 'var(--accent-text)' : 'var(--text-primary)' }}>{option}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count} vote{count !== 1 ? 's' : ''}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isLeading ? 'var(--accent)' : 'var(--text-secondary)', minWidth: '36px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TEXT RESPONSES ── */}
      {!isPoll && !isCatchUp && !isSurvey && (
        <>
          {/* Search bar */}
          {responses.length > 4 && (
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Search responses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', padding: '9px 14px 9px 36px', fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.04)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1 }}>×</button>
              )}
            </div>
          )}

          {responses.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className={`btn btn-xs${!filter ? ' btn-primary' : ''}`} onClick={() => setFilter('')}>All</button>
              {allCats.map(c => <button key={c} className={`btn btn-xs${filter === c ? ' btn-primary' : ''}`} onClick={() => setFilter(c)}>{c}</button>)}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <button className={`btn btn-xs${sort === 'newest' ? ' btn-primary' : ''}`} onClick={() => setSort('newest')}>Newest</button>
                <button className={`btn btn-xs${sort === 'top' ? ' btn-primary' : ''}`} onClick={() => setSort('top')}>Top</button>
              </div>
            </div>
          )}
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}
          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <p style={{ fontSize: '2rem' }}>{search ? '🔍' : '💬'}</p>
              <p>{search ? `No responses match "${search}"` : 'No responses yet.'}</p>
              {search && <button className="btn btn-sm" style={{ marginTop: '12px' }} onClick={() => setSearch('')}>Clear search</button>}
            </div>
          )}
          {filtered.map((r, i) => (
            <div key={r.id} className="response-card" style={{ animationDelay: `${i * 0.04}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                {r.category && r.category !== 'General' ? <span className="tag tag-gray">{r.category}</span> : <span />}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.65 }}>{r.text}</p>
              {Object.keys(r.reactions ?? {}).filter(e => (r.reactions[e] as number) > 0).length > 0 && (
                <div className="reactions" style={{ marginTop: '10px' }}>
                  {Object.entries(r.reactions).filter(([,v]) => (v as number) > 0).map(([e, v]) => (
                    <span key={e} className="react-btn" style={{ cursor: 'default' }}>{e} {v as number}</span>
                  ))}
                </div>
              )}
              {isAdmin && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <button className="btn btn-xs btn-danger" onClick={() => deleteResponse(r.id)}>Delete</button>
                  <AdminNote responseId={r.id} />
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {showShare && session && (
        <ShareModal url={shareUrl} title={session.title} description={session.description} onClose={() => setShowShare(false)} />
      )}
      {showQR && (
        <QRModal url={shareUrl} title={session?.title ?? 'Whispr Session'} onClose={() => setShowQR(false)} />
      )}
      {showWACard && session && (
        <WAStatusCard session={session} shareUrl={shareUrl} onClose={() => setShowWACard(false)} />
      )}
      <Credit />
    </div>
  )
}
