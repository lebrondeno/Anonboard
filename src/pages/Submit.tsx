import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, SESSION_TYPES, REACTIONS } from '../lib/supabase'
import type { Session, Response } from '../lib/supabase'
import Credit from '../components/Credit'
import { IconPill } from '../components/SessionIcon'
import { PinGate } from './PinEntry'
import { getSubmissionCount, incrementSubmissionCount } from '../lib/fingerprint'
import { getOrCreateAnonSession, hasAnonSubmitted } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'

type Status = 'loading' | 'pin' | 'ready' | 'submitting' | 'success' | 'notfound' | 'closed' | 'expired' | 'already_submitted'

export default function Submit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [text, setText] = useState('')
  const [category, setCategory] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [voted, setVoted] = useState<Record<string, string>>({})
  const [pollVote, setPollVote] = useState('')        // which poll option selected
  const [hasVotedPoll, setHasVotedPoll] = useState(false)
  const [anonUserId, setAnonUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    // Try by UUID first, then by slug
    const isUUID = /^[0-9a-f-]{36}$/.test(id ?? '')
    const sessionQuery = isUUID
      ? supabase.from('sessions').select('*').eq('id', id).single()
      : supabase.from('sessions').select('*').eq('slug', id).single()

    Promise.all([
      sessionQuery,
      supabase.from('responses').select('*').eq('session_id', id).order('created_at', { ascending: false })
    ]).then(async ([{ data: s }, { data: r }]) => {
      if (!s) { setStatus('notfound'); return }
      const sess = s as Session
      if (sess.type === 'catchup') { navigate(`/chat/${id}`, { replace: true }); return }
      if (sess.type === 'survey') { navigate(`/survey/${id}`, { replace: true }); return }
      if (sess.is_closed) { setStatus('closed'); return }
      if (sess.expires_at && new Date(sess.expires_at) < new Date()) { setStatus('expired'); return }
      const rList = (r as Response[]) ?? []
      if (sess.max_responses && rList.length >= sess.max_responses) { setStatus('closed'); return }
      setSession(sess)
      setCategory(sess.categories?.[0] ?? 'General')
      setResponses(rList)
      if (sess.member_theme && sess.member_theme !== 'auto') {
        document.documentElement.setAttribute('data-theme', sess.member_theme)
      }
      const anonId = await getOrCreateAnonSession()
      setAnonUserId(anonId)
      if (anonId) {
        const already = await hasAnonSubmitted(id!, anonId)
        if (already) { setStatus('already_submitted'); return }
      }
      if (sess.pin) { setStatus('pin') } else { setStatus('ready') }
    })
    const savedVotes = localStorage.getItem(`votes_${id}`)
    if (savedVotes) setVoted(JSON.parse(savedVotes))
    const savedPoll = localStorage.getItem(`poll_${id}`)
    if (savedPoll) { setPollVote(savedPoll); setHasVotedPoll(true) }
  }, [id])

  async function submitPollVote(option: string) {
    if (hasVotedPoll) return
    setHasVotedPoll(true); setPollVote(option)
    localStorage.setItem(`poll_${id}`, option)
    await supabase.from('responses').insert({ session_id: id, text: option, category: 'poll', poll_choice: option, reactions: {} })
    // refresh responses to show updated counts
    const { data } = await supabase.from('responses').select('*').eq('session_id', id)
    setResponses((data as Response[]) ?? [])
  }

  async function submitText() {
    if (!text.trim()) { setSubmitError('Say something first.'); return }
    // Rate limit: max 5 responses per device per session
    const count = getSubmissionCount(id ?? '')
    if (count >= 5) { setSubmitError('This session has hit its response limit — no more can be added.'); return }
    setStatus('submitting'); setSubmitError('')
    const { error } = await supabase.from('responses').insert({ session_id: id, text: text.trim(), category, poll_choice: '', reactions: {}, anon_user_id: anonUserId })
    if (error) { setSubmitError('Something went wrong. Try again.'); setStatus('ready'); return }
    incrementSubmissionCount(id ?? '')
    setText(''); setStatus('success')
  }

  async function react(responseId: string, emoji: string, current: Record<string, number>) {
    if (voted[responseId]) return
    const updated = { ...current, [emoji]: (current[emoji] ?? 0) + 1 }
    await supabase.from('responses').update({ reactions: updated }).eq('id', responseId)
    setResponses(prev => prev.map(r => r.id === responseId ? { ...r, reactions: updated } : r))
    const newVotes = { ...voted, [responseId]: emoji }
    setVoted(newVotes)
    localStorage.setItem(`votes_${id}`, JSON.stringify(newVotes))
  }

  const typeInfo = session ? SESSION_TYPES[session.type] : null
  const isPoll = session?.type === 'poll'

  // Poll vote tallies
  const pollTotals: Record<string, number> = {}
  if (isPoll && session?.poll_options) {
    session.poll_options.forEach(o => { pollTotals[o] = 0 })
    responses.forEach(r => { if (r.poll_choice) pollTotals[r.poll_choice] = (pollTotals[r.poll_choice] ?? 0) + 1 })
  }
  const totalVotes = Object.values(pollTotals).reduce((a, b) => a + b, 0)

  if (status === 'loading') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner" />
    </div>
  )
  if (status === 'pin' && session?.pin) return (
    <PinGate correctPin={session.pin} onUnlock={() => setStatus('ready')} />
  )

  if (status === 'already_submitted') return (
    <div className="page" style={{ alignItems:'center', justifyContent:'center', textAlign:'center' }}>
      <div className="animate-in">
        <p style={{ fontSize:'3rem', marginBottom:'14px' }}>✅</p>
        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, letterSpacing:'-.03em', color:'var(--text-primary)', marginBottom:'8px', fontStyle:'italic' }}>Already submitted.</p>
        <p style={{ fontSize:'.9rem', color:'var(--text-secondary)', lineHeight:1.7, maxWidth:'280px' }}>
          You've already responded to this session. Your answer is in and nothing is attached to you.
        </p>
      </div>
      <Credit />
    </div>
  )

  if (status === 'closed') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</p>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Session closed</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.6 }}>This session is no longer accepting responses.</p>
      <Credit />
    </div>
  )

  if (status === 'expired') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏰</p>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Session expired</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.6 }}>This session has passed its deadline.</p>
      <Credit />
    </div>
  )

  if (status === 'notfound') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <p style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</p>
      <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Session not found</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '6px' }}>This link may be expired or incorrect.</p>
      <Credit />
    </div>
  )
  if (status === 'success') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="animate-in">
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎉</div>
        <p style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '8px' }}>Submitted!</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: 1.6 }}>Your response was recorded anonymously.</p>
        <button className="btn" style={{ marginTop: '1.5rem' }} onClick={() => setStatus('ready')}>Submit another</button>
      </div>
      <Credit />
    </div>
  )

  return (
    <div className="page" style={{ padding: '0 0 5rem' }}>

      {/* Cover image */}
      {session?.cover_image && (
        <div style={{ position: 'relative', width: '100%', height: '220px' }}>
          <img src={session.cover_image} alt="Cover" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,13,15,0.5) 0%, rgba(13,13,15,0) 50%, rgba(13,13,15,0.8) 100%)' }} />
          <p style={{ position: 'absolute', top: '16px', left: '20px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.03em' }}>Whispr</p>
        </div>
      )}

      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        {!session?.cover_image && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="animate-in">
            <p className="wordmark">Whispr</p>
            <ThemeToggle />
          </div>
        )}

        {/* Session header */}
        <div className="card-glow animate-in-d1" style={{ marginBottom: '14px', marginTop: session?.cover_image ? '12px' : 0 }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <IconPill type={(session?.type ?? 'openfloor') as any} size={44} />
            <div style={{ flex: 1 }}>
              <span className={`tag ${typeInfo?.color}`} style={{ marginBottom: '8px', display: 'inline-flex' }}>{typeInfo?.label}</span>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, letterSpacing: '-0.02em' }}>{session?.title}</p>
              {session?.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>{session.description}</p>}
              {isPoll && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} so far</p>}
            </div>
          </div>
        </div>

        {/* ── POLL UI ── */}
        {isPoll && session?.poll_options && (
          <div className="animate-in-d2" style={{ marginBottom: '16px' }}>
            <p className="section-label" style={{ marginBottom: '10px' }}>
              {hasVotedPoll ? 'Results' : 'Cast your vote'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {session.poll_options.map((option) => {
                const count = pollTotals[option] ?? 0
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                const isMyVote = pollVote === option
                const didVote = hasVotedPoll

                return (
                  <div
                    key={option}
                    className={`poll-option${isMyVote ? ' voted-this' : didVote ? ' voted-other' : ''}`}
                    onClick={() => !didVote && submitPollVote(option)}
                  >
                    {/* Progress bar (shown after voting) */}
                    {didVote && <div className="poll-bar" style={{ width: `${pct}%` }} />}

                    {/* Radio circle */}
                    <div className="poll-radio">
                      <div className="poll-radio-dot" />
                    </div>

                    <span className="poll-option-label" style={{ position: 'relative' }}>{option}</span>

                    {/* Percentage (after voting) */}
                    {didVote && <span className="poll-pct" style={{ position: 'relative' }}>{pct}%</span>}
                  </div>
                )
              })}
            </div>
            {hasVotedPoll && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
                ✓ Your vote is locked in · {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* ── TEXT SUBMISSION (non-poll) ── */}
        {!isPoll && (
          <div className="card animate-in-d2" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label>Your response</label>
                <textarea placeholder={typeInfo?.placeholder ?? 'Type your response...'} value={text} onChange={e => setText(e.target.value)} />
              </div>
              {session?.categories && session.categories.length > 1 && (
                <div className="field">
                  <label>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {session.categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            {submitError && <p className="error-text">{submitError}</p>}
            <button className="btn btn-primary btn-full" style={{ marginTop: '12px' }} onClick={submitText} disabled={status === 'submitting'}>
              {status === 'submitting' ? <><span className="spinner spinner-white" /> Submitting...</> : 'Send it in'}
            </button>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              No name · No number · No account
            </p>
          </div>
        )}

        {/* Responses feed (non-poll) */}
        {!isPoll && responses.length > 0 && session?.allow_reactions && (
          <>
            <p className="section-label">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
            {responses.map((r, i) => (
              <div key={r.id} className="response-card" style={{ animationDelay: `${i * 0.04}s` }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.65 }}>{r.text}</p>
                {r.category && r.category !== 'General' && (
                  <span className="tag tag-gray" style={{ marginTop: '8px', display: 'inline-flex' }}>{r.category}</span>
                )}
                <div className="reactions" style={{ marginTop: '10px' }}>
                  {REACTIONS.map(emoji => {
                    const count = r.reactions?.[emoji] ?? 0
                    const myVote = voted[r.id] === emoji
                    return (
                      <button key={emoji} className={`react-btn${myVote ? ' active' : ''}`}
                        onClick={() => react(r.id, emoji, r.reactions ?? {})} disabled={!!voted[r.id]}>
                        {emoji} {count > 0 && <span>{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        <Credit />
      </div>
    </div>
  )
}
