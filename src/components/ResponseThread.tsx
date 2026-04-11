import { useState, useEffect } from 'react'
import { supabase, getAnonIdentity } from '../lib/supabase'
import type { ResponseReply } from '../lib/supabase'

interface Props {
  responseId: string
  sessionId: string
  accentColor?: string
}

export default function ResponseThread({ responseId, sessionId, accentColor = '#4F46E5' }: Props) {
  const [replies, setReplies] = useState<ResponseReply[]>([])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const identity = getAnonIdentity(sessionId)

  useEffect(() => {
    if (!open || loaded) return
    supabase.from('response_replies')
      .select('*').eq('response_id', responseId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setReplies((data as ResponseReply[]) ?? [])
        setLoaded(true)
      })
  }, [open, responseId, loaded])

  // Realtime
  useEffect(() => {
    if (!open) return
    const channel = supabase.channel(`replies:${responseId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'response_replies',
        filter: `response_id=eq.${responseId}`
      }, p => {
        setReplies(prev => prev.find(r => r.id === p.new.id) ? prev : [...prev, p.new as ResponseReply])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open, responseId])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    await supabase.from('response_replies').insert({
      response_id: responseId,
      session_id: sessionId,
      text: text.trim(),
      anon_name: identity.anon_name,
      anon_color: identity.anon_color,
    })
    setText(''); setSending(false)
  }

  function timeAgo(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s/60)}m ago`
    return `${Math.floor(s/3600)}h ago`
  }

  return (
    <div style={{ marginTop: '10px' }}>
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <span style={{ fontSize: '0.7rem', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
        {open ? 'Hide replies' : `Reply anonymously${replies.length > 0 || loaded ? ` · ${replies.length}` : ''}`}
      </button>

      {open && (
        <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: `2px solid ${accentColor}30` }}>
          {/* Replies list */}
          {replies.map(r => (
            <div key={r.id} style={{ marginBottom: '10px', animation: 'fadeUp 0.2s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.anon_color, flexShrink: 0 }} />
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: r.anon_color }}>{r.anon_name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>· {timeAgo(r.created_at)}</p>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.55, paddingLeft: '13px' }}>{r.text}</p>
            </div>
          ))}

          {replies.length === 0 && loaded && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>No replies yet. Be the first.</p>
          )}

          {/* Reply input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: '8px' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: identity.anon_color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
              {identity.anon_name.split(' ').map(w => w[0]).join('')}
            </div>
            <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: '16px', padding: '7px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Reply anonymously..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.84rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
              />
              <button onClick={send} disabled={!text.trim() || sending}
                style={{ background: text.trim() ? accentColor : 'var(--surface3)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke={text.trim() ? '#fff' : 'var(--text-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px', paddingLeft: '32px' }}>
            Replying as <strong style={{ color: identity.anon_color }}>{identity.anon_name}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
