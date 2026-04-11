import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session, SurveyQuestion } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import Credit from '../components/Credit'
import { PinGate } from './PinEntry'
import { hasSubmitted, markSubmitted } from '../lib/fingerprint'
import { getOrCreateAnonSession, hasAnonSubmitted } from '../lib/supabase'

type Status = 'loading' | 'pin' | 'ready' | 'submitting' | 'success' | 'notfound' | 'already_submitted'

const STARS = [1, 2, 3, 4, 5]

export default function Survey() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [anonUserId, setAnonUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!id) return
    const init = async () => {
      const { data } = await supabase.from('sessions').select('*').eq('id', id).single()
      if (!data) { setStatus('notfound'); return }
      if (hasSubmitted(id!)) { setStatus('already_submitted'); return }
      const anonId = await getOrCreateAnonSession()
      setAnonUserId(anonId)
      if (anonId) {
        const already = await hasAnonSubmitted(id!, anonId)
        if (already) { setStatus('already_submitted'); return }
      }
      const sess = data as Session
      setSession(sess)
      if (sess.member_theme && sess.member_theme !== 'auto') {
        document.documentElement.setAttribute('data-theme', sess.member_theme)
      }
      if (sess.pin) { setStatus('pin') } else { setStatus('ready') }
    }
    init()
  }, [id])

  function setAnswer(qid: string, val: string) {
    setAnswers(prev => ({ ...prev, [qid]: val }))
    setErrors(prev => ({ ...prev, [qid]: false }))
  }

  async function submit() {
    if (!session) return
    const qs: SurveyQuestion[] = session.survey_questions ?? []
    const newErrors: Record<string, boolean> = {}
    qs.forEach(q => {
      if (q.required && !answers[q.id]?.trim()) newErrors[q.id] = true
    })
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSubmitError('A few questions still need an answer.')
      return
    }
    setStatus('submitting'); setSubmitError('')
    const { error } = await supabase.from('responses').insert({
      session_id: id, text: 'survey', category: 'survey',
      poll_choice: '', survey_answers: answers, reactions: {}, anon_user_id: anonUserId
    })
    if (error) { setSubmitError('Something went sideways. Try again?'); setStatus('ready'); return }
    markSubmitted(id!)
    setStatus('success')
  }

  if (status === 'loading') return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <span className="spinner" />
    </div>
  )
  if (status === 'pin' && session?.pin) return (
    <PinGate correctPin={session.pin} onUnlock={() => setStatus('ready')} />
  )

  if (status === 'notfound') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <p style={{ fontSize: '3rem' }}>🔍</p>
      <p style={{ fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>Survey not found</p>
      <Credit />
    </div>
  )
  if (status === 'already_submitted') return (
    <div className="page" style={{ alignItems:'center', justifyContent:'center', textAlign:'center' }}>
      <div className="animate-in">
        <p style={{ fontSize:'3rem', marginBottom:'14px' }}>✅</p>
        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, letterSpacing:'-.03em', color:'var(--text-primary)', marginBottom:'8px', fontStyle:'italic' }}>Already submitted.</p>
        <p style={{ fontSize:'.9rem', color:'var(--text-secondary)', lineHeight:1.7, maxWidth:'280px' }}>You've already filled this survey out. Your answers are safe — nothing is attached to you.</p>
      </div>
      <Credit />
    </div>
  )

  if (status === 'success') return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="animate-in">
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎉</div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Thank you!
        </p>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '280px' }}>
          Your responses were submitted anonymously.
        </p>
      </div>
      <Credit />
    </div>
  )

  const questions: SurveyQuestion[] = session?.survey_questions ?? []

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} className="animate-in">
        <p className="wordmark">Whi<em>spr</em></p>
        <ThemeToggle />
      </div>

      {/* Cover image */}
      {session?.cover_image && (
        <div style={{ marginBottom: '1.25rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }} className="animate-in-d1">
          <img src={session.cover_image} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Session info */}
      <div className="card-accent animate-in-d1" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>📋</span>
          <div>
            <span className="tag tag-blue" style={{ marginBottom: '6px', display: 'inline-flex' }}>Survey</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {session?.title}
            </p>
            {session?.description && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
                {session.description}
              </p>
            )}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {questions.length} question{questions.length !== 1 ? 's' : ''} · anonymous
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, i) => (
        <div key={q.id} className="card animate-in" style={{ marginBottom: '12px', animationDelay: `${i * 0.06}s` }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--accent)', marginRight: '6px', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{i + 1}.</span>
              {q.text}
              {q.required && <span style={{ color: 'var(--red)', marginLeft: '4px' }}>*</span>}
            </p>
            {errors[q.id] && (
              <p style={{ fontSize: '0.78rem', color: 'var(--red-text)', marginTop: '4px' }}>This question is required</p>
            )}
          </div>

          {/* Short answer */}
          {q.type === 'short' && (
            <input type="text" placeholder="Your answer..."
              value={answers[q.id] ?? ''}
              onChange={e => setAnswer(q.id, e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: `1px solid ${errors[q.id] ? 'var(--red)' : 'var(--border-md)'}`, borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.9375rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = errors[q.id] ? 'var(--red)' : 'var(--border-md)'}
            />
          )}

          {/* Long answer */}
          {q.type === 'long' && (
            <textarea placeholder="Your answer..."
              value={answers[q.id] ?? ''}
              onChange={e => setAnswer(q.id, e.target.value)}
              rows={4}
              style={{ width: '100%', background: 'var(--bg2)', border: `1px solid ${errors[q.id] ? 'var(--red)' : 'var(--border-md)'}`, borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.9375rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = errors[q.id] ? 'var(--red)' : 'var(--border-md)'}
            />
          )}

          {/* Multiple choice */}
          {q.type === 'choice' && q.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.options.map(opt => {
                const selected = answers[q.id] === opt
                return (
                  <div key={opt} onClick={() => setAnswer(q.id, opt)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${selected ? 'var(--accent)' : errors[q.id] ? 'var(--red)' : 'var(--border-md)'}`, background: selected ? 'var(--accent-soft)' : 'var(--bg2)', cursor: 'pointer', transition: 'all 0.15s', boxShadow: selected ? '0 0 0 2px var(--accent-soft)' : 'var(--shadow-sm)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-lg)'}`, background: selected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: '0.9375rem', color: selected ? 'var(--accent-text)' : 'var(--text-primary)', fontWeight: selected ? 500 : 400 }}>{opt}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Yes / No */}
          {q.type === 'yesno' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {['Yes', 'No'].map(opt => {
                const selected = answers[q.id] === opt
                return (
                  <button key={opt} onClick={() => setAnswer(q.id, opt)}
                    style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-md)'}`, background: selected ? 'var(--accent-soft)' : 'var(--bg2)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: selected ? 600 : 400, color: selected ? 'var(--accent-text)' : 'var(--text-primary)', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}>
                    {opt === 'Yes' ? '✓ Yes' : '✕ No'}
                  </button>
                )
              })}
            </div>
          )}

          {/* Star rating */}
          {q.type === 'rating' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {STARS.map(n => {
                const val = Number(answers[q.id] ?? 0)
                const filled = n <= val
                return (
                  <button key={n} onClick={() => setAnswer(q.id, String(n))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2rem', lineHeight: 1, transition: 'transform 0.12s', color: filled ? 'var(--amber)' : 'var(--border-lg)', padding: '2px' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                    {filled ? '★' : '☆'}
                  </button>
                )
              })}
              {answers[q.id] && (
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                  {answers[q.id]}/5
                </span>
              )}
            </div>
          )}
        </div>
      ))}

      {submitError && <p className="error-text" style={{ marginBottom: '12px' }}>{submitError}</p>}

      <button className="btn btn-primary btn-full animate-in-d3" onClick={submit} disabled={status === 'submitting'}>
        {status === 'submitting' ? <><span className="spinner spinner-white" /> Submitting...</> : 'Submit →'}
      </button>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
        No name · No number · No account
      </p>

      <Credit />
    </div>
  )
}
