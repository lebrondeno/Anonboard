import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, SESSION_TYPES, REACTIONS } from '../lib/supabase'
import type { Session, Response } from '../lib/supabase'
import Credit from '../components/Credit'

type Status = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'notfound'

export default function Submit() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [text, setText] = useState('')
  const [category, setCategory] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [voted, setVoted] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('sessions').select('id,title,description,type,categories,allow_reactions,allow_replies,created_at').eq('id', id).single(),
      supabase.from('responses').select('*').eq('session_id', id).order('created_at', { ascending: false })
    ]).then(([{ data: s }, { data: r }]) => {
      if (!s) { setStatus('notfound'); return }
      setSession(s as Session)
      setCategory((s as Session).categories?.[0] ?? 'General')
      setResponses((r as Response[]) ?? [])
      setStatus('ready')
    })
    const saved = localStorage.getItem(`votes_${id}`)
    if (saved) setVoted(JSON.parse(saved))
  }, [id])

  async function submit() {
    if (!text.trim()) { setSubmitError('Please write something first.'); return }
    setStatus('submitting'); setSubmitError('')
    const { error } = await supabase.from('responses').insert({ session_id: id, text: text.trim(), category, reactions: {} })
    if (error) { setSubmitError('Something went wrong. Please try again.'); setStatus('ready'); return }
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

  if (status === 'loading') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner" />
    </div>
  )

  if (status === 'notfound') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <p style={{ fontSize: '2.5rem' }}>🔍</p>
      <p style={{ fontWeight: 500, marginTop: '12px' }}>Session not found</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>This link may be expired or incorrect.</p>
      <Credit />
    </div>
  )

  if (status === 'success') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="animate-in">
        <p style={{ fontSize: '3rem' }}>✅</p>
        <p style={{ fontWeight: 500, fontSize: '1.1rem', marginTop: '14px' }}>Submitted!</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '300px', lineHeight: 1.6 }}>
          Your response was recorded anonymously.
        </p>
        <button className="btn" style={{ marginTop: '1.5rem' }} onClick={() => setStatus('ready')}>
          Submit another
        </button>
      </div>
      <Credit />
    </div>
  )

  return (
    <div className="page">
      <div style={{ marginBottom: '1.25rem' }} className="animate-in">
        <p className="wordmark">Whi<span>spr</span></p>
      </div>

      {/* Session header */}
      <div className="card animate-in-d1" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{typeInfo?.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span className={`tag ${typeInfo?.tagColor}`}>{typeInfo?.label}</span>
            </div>
            <p style={{ fontWeight: 500, fontSize: '1rem', lineHeight: 1.4 }}>{session?.title}</p>
            {session?.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.55 }}>{session.description}</p>}
          </div>
        </div>
      </div>

      {/* Submission form */}
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
        <button className="btn btn-primary btn-full" style={{ marginTop: '12px' }} onClick={submit} disabled={status === 'submitting'}>
          {status === 'submitting' ? <><span className="spinner spinner-white" /> Submitting...</> : 'Submit anonymously'}
        </button>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
          No name · No number · No account
        </p>
      </div>

      {/* Public responses feed */}
      {responses.length > 0 && session?.allow_reactions && (
        <>
          <p className="section-label">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
          {responses.map((r, i) => (
            <div key={r.id} className="card animate-in" style={{ animationDelay: `${i * 0.035}s`, marginBottom: '10px' }}>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.65 }}>{r.text}</p>
              {r.category && r.category !== 'General' && (
                <span className="tag tag-gray" style={{ marginTop: '8px', display: 'inline-flex' }}>{r.category}</span>
              )}
              <div className="reactions" style={{ marginTop: '10px' }}>
                {REACTIONS.map(emoji => {
                  const count = r.reactions?.[emoji] ?? 0
                  const myVote = voted[r.id] === emoji
                  return (
                    <button key={emoji} className={`react-btn${myVote ? ' active' : ''}`} onClick={() => react(r.id, emoji, r.reactions ?? {})} disabled={!!voted[r.id]}>
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
  )
}
