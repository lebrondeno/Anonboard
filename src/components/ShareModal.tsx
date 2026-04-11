import { useState } from 'react'

interface Props {
  url: string
  title: string
  description?: string
  onClose: () => void
}

const SHARE_APPS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${url}`)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: '✈️',
    color: '#0088CC',
    getUrl: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    icon: '𝕏',
    color: '#000000',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    getUrl: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: '✉️',
    color: '#6B7280',
    getUrl: (url: string, title: string, description?: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description ?? title}\n\nRespond here (anonymous):\n${url}`)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: '📱',
    color: '#059669',
    getUrl: (url: string, title: string) =>
      `sms:?body=${encodeURIComponent(`${title}\n${url}`)}`,
  },
]

export default function ShareModal({ url, title, description, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [nativeShared, setNativeShared] = useState(false)
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  async function nativeShare() {
    try {
      await navigator.share({ title, text: description ?? title, url })
      setNativeShared(true)
      setTimeout(() => setNativeShared(false), 2000)
    } catch (e) {
      // User cancelled or not supported
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function openApp(app: typeof SHARE_APPS[0]) {
    window.open(app.getUrl(url, title, description), '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0', backdropFilter:'blur(6px)' }}
      onClick={onClose}
    >
      {/* Sheet slides up from bottom on mobile, centered on desktop */}
      <div
        style={{ background:'var(--bg)', borderRadius:'var(--radius-xl) var(--radius-xl) 0 0', width:'100%', maxWidth:'520px', boxShadow:'var(--shadow-lg)', border:'1px solid var(--border-md)', borderBottom:'none', animation:'slideUp .3s cubic-bezier(.22,1,.36,1) both', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>

        {/* Handle bar */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--border-lg)' }} />
        </div>

        <div style={{ padding:'0 1.5rem 2rem' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem', paddingTop:'8px' }}>
            <div>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700, letterSpacing:'-.02em', color:'var(--text-primary)', fontStyle:'italic' }}>
                Share this session
              </p>
              <p style={{ fontSize:'.8rem', color:'var(--text-muted)', marginTop:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'280px' }}>{title}</p>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1.4rem', lineHeight:1, padding:'2px', marginTop:'2px' }}>×</button>
          </div>

          {/* Native share button — primary CTA on mobile */}
          {hasNativeShare && (
            <button
              onClick={nativeShare}
              className="btn btn-primary btn-full"
              style={{ marginBottom:'1.25rem', padding:'13px', fontSize:'.9375rem', gap:'10px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {nativeShared ? 'Shared!' : 'Share via…'}
            </button>
          )}

          {/* App grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'1.25rem' }}>
            {SHARE_APPS.map(app => (
              <button
                key={app.id}
                onClick={() => openApp(app)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', padding:'12px 8px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', cursor:'pointer', transition:'all .15s', fontFamily:'var(--font-body)' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${app.color}15`; el.style.borderColor = `${app.color}40`; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'var(--surface2)'; el.style.borderColor = 'var(--border)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
              >
                <span style={{ fontSize:'1.5rem', lineHeight:1 }}>{app.icon}</span>
                <span style={{ fontSize:'.68rem', fontWeight:600, color:'var(--text-secondary)', textAlign:'center', lineHeight:1.3 }}>{app.label}</span>
              </button>
            ))}
          </div>

          {/* Copy link */}
          <div className="link-box">
            <span className="link-text">{url}</span>
            <button
              className={`btn btn-sm${copied ? ' btn-green' : ''}`}
              onClick={copyLink}
              style={{ flexShrink:0, transition:'all .2s' }}
            >
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>

          <p style={{ fontSize:'.74rem', color:'var(--text-muted)', textAlign:'center', marginTop:'10px', lineHeight:1.5 }}>
            Anyone with this link can respond anonymously — no account needed.
          </p>
        </div>
      </div>
    </div>
  )
}
