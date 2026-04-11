import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase, getAnonIdentity } from '../lib/supabase'
import type { Session, ChatMessage } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import Credit from '../components/Credit'
import EmojiPicker, { trackRecentEmoji } from '../components/EmojiPicker'

type Status = 'loading' | 'ready' | 'notfound'
type PickerMode = null | 'emoji' | 'react'

export default function CatchUp() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isHost = searchParams.get('host') === '1'
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [pickerMode, setPickerMode] = useState<PickerMode>(null)
  const [reactTargetId, setReactTargetId] = useState<string | null>(null)
  const [onlineCount, setOnlineCount] = useState(1)
  const [uploadingSticker, setUploadingSticker] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickerInputRef = useRef<HTMLInputElement>(null)
  const identity = id ? getAnonIdentity(id) : { anon_id: '', anon_name: '', anon_color: '#7c6ff7' }

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('sessions').select('*').eq('id', id).single(),
      supabase.from('chat_messages').select('*').eq('session_id', id).order('created_at', { ascending: true })
    ]).then(([{ data: s }, { data: m }]) => {
      if (!s) { setStatus('notfound'); return }
      const sess = s as Session
      setSession(sess)
      if (sess.member_theme && sess.member_theme !== 'auto') {
        document.documentElement.setAttribute('data-theme', sess.member_theme)
      }
      setMessages((m as ChatMessage[]) ?? [])
      setStatus('ready')
    })
  }, [id])

  useEffect(() => {
    if (!id || status !== 'ready') return
    const channel = supabase.channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${id}` },
        (p) => setMessages(prev => prev.find(m => m.id === p.new.id) ? prev : [...prev, p.new as ChatMessage]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${id}` },
        (p) => setMessages(prev => prev.map(m => m.id === p.new.id ? p.new as ChatMessage : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (p) => setMessages(prev => prev.filter(m => m.id !== p.old.id)))
      .on('presence', { event: 'sync' }, () => setOnlineCount(Object.keys(channel.presenceState()).length))
      .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') await channel.track({ anon_id: identity.anon_id, online_at: new Date().toISOString() })
      })
    return () => { supabase.removeChannel(channel) }
  }, [id, status])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function pushMessage(msgText: string) {
    if (!msgText.trim() || !id) return
    // Cap at 500 messages per session
    if (messages.length >= 500) {
      alert('This chat has reached the 500 message limit. The admin can export and clear the history.')
      return
    }
    setSending(true)
    await supabase.from('chat_messages').insert({
      session_id: id,
      anon_id: identity.anon_id,
      anon_name: identity.anon_name,
      anon_color: identity.anon_color,
      text: msgText.trim(),
      reply_to: replyTo?.id ?? null,
      reply_preview: replyTo ? replyTo.text.slice(0, 80) : '',
      reply_name: replyTo?.anon_name ?? '',
      reactions: {},
      reactor_ids: {},
      is_pinned: false,
    })
    setReplyTo(null)
    setSending(false)
  }

  async function sendText() {
    if (!text.trim() || sending) return
    const t = text; setText(''); setPickerMode(null)
    await pushMessage(t)
    inputRef.current?.focus()
  }

  // Insert emoji into text at cursor
  function insertEmoji(emoji: string) {
    trackRecentEmoji(emoji)
    const ta = inputRef.current
    if (!ta) { setText(prev => prev + emoji); return }
    const start = ta.selectionStart ?? text.length
    const end = ta.selectionEnd ?? text.length
    const newText = text.slice(0, start) + emoji + text.slice(end)
    setText(newText)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + emoji.length, start + emoji.length) }, 0)
  }

  // Custom image sticker upload
  async function handleStickerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    e.target.value = ''
    setUploadingSticker(true)
    setPickerMode(null)

    // Compress image before upload using canvas
    const compressed = await compressImage(file, 512)
    const filename = `stickers/${id}_${Date.now()}.webp`
    const { error } = await supabase.storage.from('covers').upload(filename, compressed, { upsert: true, contentType: 'image/webp' })
    if (error) { setUploadingSticker(false); alert('Upload failed: ' + error.message); return }
    const { data } = supabase.storage.from('covers').getPublicUrl(filename)
    await pushMessage(`IMG_STICKER:${data.publicUrl}`)
    setUploadingSticker(false)
  }

  async function compressImage(file: File, maxSize: number): Promise<Blob> {
    // GIF — send as-is (no canvas compression breaks animation)
    if (file.type === 'image/gif') return file

    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        canvas.toBlob(blob => resolve(blob ?? file), 'image/webp', 0.82)
      }
      img.src = url
    })
  }

  async function reactToMessage(msg: ChatMessage, emoji: string) {
    trackRecentEmoji(emoji)
    setPickerMode(null); setReactTargetId(null)
    const reactors = msg.reactor_ids?.[emoji] ?? []
    const alreadyReacted = reactors.includes(identity.anon_id)
    const newReactors = alreadyReacted ? reactors.filter((r: string) => r !== identity.anon_id) : [...reactors, identity.anon_id]
    const newCount = alreadyReacted ? Math.max(0, (msg.reactions?.[emoji] ?? 1) - 1) : (msg.reactions?.[emoji] ?? 0) + 1
    const updatedReactions = { ...msg.reactions, [emoji]: newCount }
    const updatedReactorIds = { ...msg.reactor_ids, [emoji]: newReactors }
    if (newCount === 0) { delete updatedReactions[emoji]; delete updatedReactorIds[emoji] }
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: updatedReactions, reactor_ids: updatedReactorIds } : m))
    await supabase.from('chat_messages').update({ reactions: updatedReactions, reactor_ids: updatedReactorIds }).eq('id', msg.id)
  }

  function parseMessage(text: string) {
    if (text.startsWith('IMG_STICKER:')) return { type: 'img_sticker', url: text.replace('IMG_STICKER:', '') }
    return { type: 'text', url: '' }
  }

  function isMe(msg: ChatMessage) { return msg.anon_id === identity.anon_id }
  function timeStr(d: string) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

  function closeAll() { setPickerMode(null); setReactTargetId(null) }

  if (status === 'loading') return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <span className="spinner" />
    </div>
  )
  if (status === 'notfound') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', textAlign: 'center', padding: '2rem' }}>
      <p style={{ fontSize: '3rem' }}>🔍</p>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '12px', color: 'var(--text-primary)' }}>Session not found</p>
      <Credit />
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', maxWidth: '600px', margin: '0 auto', position: 'relative' }} onClick={closeAll}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
        {session?.cover_image
          ? <img src={session.cover_image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🎉</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{session?.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', display: 'inline-block' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{onlineCount} online · anonymous{isHost ? ' · 👑 Host' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', border: '1px solid var(--border-md)', borderRadius: '20px', padding: '4px 10px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: identity.anon_color }} />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{identity.anon_name}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Pinned messages */}
        {messages.filter(m => m.is_pinned).length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {messages.filter(m => m.is_pinned).map(m => (
              <div key={m.id} style={{ background: 'var(--accent-soft)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 'var(--radius-md)', padding: '8px 12px', marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem' }}>📌</span>
                <p style={{ fontSize: '0.84rem', color: 'var(--accent-text)', lineHeight: 1.5, flex: 1 }}>{m.text.startsWith('IMG_STICKER:') ? '🖼️ Image sticker' : m.text}</p>
              </div>
            ))}
          </div>
        )}

        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👋</p>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Be the first to say something!</p>
            <p style={{ fontSize: '0.8rem', marginTop: '6px', lineHeight: 1.6 }}>You are <strong style={{ color: identity.anon_color }}>{identity.anon_name}</strong>.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const me = isMe(msg)
          const prev = messages[i - 1]
          const showName = !prev || prev.anon_id !== msg.anon_id || (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) > 60000
          const parsed = parseMessage(msg.text)
          const isImgSticker = parsed.type === 'img_sticker'
          const hasReactions = Object.keys(msg.reactions ?? {}).some(e => (msg.reactions[e] ?? 0) > 0)
          const isReactTarget = reactTargetId === msg.id && pickerMode === 'react'

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: me ? 'flex-end' : 'flex-start', marginTop: showName ? '12px' : '2px', position: 'relative' }}>
              {showName && !me && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', paddingLeft: '4px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: msg.anon_color }} />
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: msg.anon_color }}>{msg.anon_name}</p>
                </div>
              )}

              {/* Reply preview */}
              {msg.reply_to && msg.reply_preview && (
                <div style={{ maxWidth: '75%', marginBottom: '4px', background: 'var(--surface2)', borderRadius: '10px', padding: '6px 10px', borderLeft: `3px solid ${me ? identity.anon_color : msg.anon_color}`, opacity: 0.8 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>{msg.reply_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.reply_preview.startsWith('IMG_STICKER:') ? '🖼️ Sticker' : msg.reply_preview}
                  </p>
                </div>
              )}

              {/* ── Image sticker ── */}
              {isImgSticker ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={parsed.url}
                    alt="sticker"
                    style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 12, cursor: 'pointer', transition: 'transform 0.15s', display: 'block', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    onDoubleClick={e => { e.stopPropagation(); setReactTargetId(msg.id); setPickerMode('react') }}
                  />
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: me ? 'right' : 'left', marginTop: '2px' }}>{timeStr(msg.created_at)}</p>
                </div>
              ) : (
                /* ── Text bubble ── */
                <div style={{ position: 'relative', maxWidth: '78%' }}>
                  <div
                    style={{ background: me ? 'var(--accent)' : 'var(--surface)', border: me ? 'none' : '1px solid var(--border)', borderRadius: me ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '10px 14px', cursor: 'pointer', boxShadow: me ? '0 4px 16px var(--accent-glow)' : 'none' }}
                    onDoubleClick={e => { e.stopPropagation(); setReactTargetId(msg.id); setPickerMode('react') }}
                    onClick={e => e.stopPropagation()}
                  >
                    <p style={{ fontSize: '0.9375rem', color: me ? '#fff' : 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                    <p style={{ fontSize: '0.65rem', color: me ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: '4px', textAlign: me ? 'right' : 'left' }}>{timeStr(msg.created_at)}</p>
                  </div>
                </div>
              )}

              {/* Reaction counts */}
              {hasReactions && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px', paddingLeft: me ? 0 : '4px', justifyContent: me ? 'flex-end' : 'flex-start' }}>
                  {Object.entries(msg.reactions).filter(([, count]) => (count as number) > 0).map(([emoji, count]) => {
                    const iReacted = (msg.reactor_ids?.[emoji] ?? []).includes(identity.anon_id)
                    return (
                      <button key={emoji} onClick={() => reactToMessage(msg, emoji)}
                        style={{ background: iReacted ? 'var(--accent-soft)' : 'var(--surface2)', border: `1px solid ${iReacted ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '12px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', color: iReacted ? 'var(--accent-text)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        {emoji} {count as number}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Full emoji reaction picker for this message */}
              {isReactTarget && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '340px', zIndex: 300 }} onClick={e => e.stopPropagation()}>
                  <EmojiPicker
                    title="React with"
                    onSelect={emoji => reactToMessage(msg, emoji)}
                    onClose={() => { setPickerMode(null); setReactTargetId(null) }}
                  />
                </div>
              )}

              {/* Action row */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '2px', opacity: 0.65 }}>
                <button onClick={() => { setReplyTo(msg); inputRef.current?.focus() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, padding: '2px 6px', borderRadius: '6px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  Reply
                </button>
                <button onClick={e => { e.stopPropagation(); setReactTargetId(msg.id); setPickerMode('react') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', padding: '2px 6px', borderRadius: '6px' }}>
                  React
                </button>
                {isHost && (
                  <>
                    <button onClick={async () => { await supabase.from('chat_messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id); setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m)) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', padding: '2px 6px', borderRadius: '6px' }}>
                      {msg.is_pinned ? 'Unpin' : '📌'}
                    </button>
                    <button onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('chat_messages').delete().eq('id', msg.id); setMessages(prev => prev.filter(m => m.id !== msg.id)) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--red-text)', fontFamily: 'var(--font-body)', padding: '2px 6px', borderRadius: '6px' }}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Reply bar ── */}
      {replyTo && (
        <div style={{ padding: '8px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: 3, minHeight: 32, borderRadius: 2, background: replyTo.anon_color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: replyTo.anon_color }}>{replyTo.anon_name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.text.startsWith('IMG_STICKER:') ? '🖼️ Sticker' : replyTo.text}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0, position: 'relative', boxShadow: '0 -1px 0 var(--border)' }} onClick={e => e.stopPropagation()}>

        {/* Emoji picker popup */}
        {pickerMode === 'emoji' && (
          <EmojiPicker onSelect={insertEmoji} onClose={() => setPickerMode(null)} />
        )}

        {/* Hidden file input for image stickers */}
        <input ref={stickerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleStickerFile} />

        {/* Anon avatar */}
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: identity.anon_color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '2px', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
          {identity.anon_name.split(' ').map(w => w[0]).join('')}
        </div>

        {/* Emoji button */}
        <button onClick={e => { e.stopPropagation(); setPickerMode(pickerMode === 'emoji' ? null : 'emoji') }}
          title="Emoji"
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border-md)', background: pickerMode === 'emoji' ? 'var(--accent-soft)' : 'var(--surface2)', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '2px', transition: 'all 0.15s', boxShadow: pickerMode === 'emoji' ? '0 0 0 2px var(--accent)' : 'none' }}>
          😊
        </button>

        {/* Sticker/image button */}
        <button
          onClick={e => { e.stopPropagation(); stickerInputRef.current?.click() }}
          title="Send image sticker"
          disabled={uploadingSticker}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border-md)', background: 'var(--surface2)', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '2px', transition: 'all 0.15s', opacity: uploadingSticker ? 0.5 : 1 }}>
          {uploadingSticker ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🖼️'}
        </button>

        {/* Text input */}
        <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: '20px', padding: '8px 14px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() } }}
            placeholder="Say something anonymously..."
            rows={1}
            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5, maxHeight: '120px', overflow: 'auto' }}
          />
        </div>

        {/* Send */}
        <button onClick={sendText} disabled={!text.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, background: text.trim() ? 'var(--accent)' : 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: text.trim() ? '0 4px 12px var(--accent-glow)' : 'none', transform: text.trim() ? 'scale(1.05)' : 'scale(1)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke={text.trim() ? '#fff' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
