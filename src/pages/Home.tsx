import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { SESSION_TYPES } from '../lib/supabase'
import type { SessionType } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import InstallPrompt from '../components/InstallPrompt'
import Credit from '../components/Credit'
import MeshBackground from '../components/MeshBackground'
import { SESSION_ICONS, TYPE_ACCENT, getTypeColors } from '../components/SessionIcon'

export default function Home() {
  const { user } = useAuth()
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', position:'relative' }}>
      <MeshBackground />

      <header className="topbar">
        <Link to="/" style={{ textDecoration:'none' }}>
          <span className="wordmark">Whi<em>spr</em></span>
        </Link>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <ThemeToggle />
          {!user && <Link to="/login" className="btn btn-sm btn-primary">Sign in</Link>}
        </div>
      </header>

      <main style={{ maxWidth:'860px', margin:'0 auto', padding:'0 var(--page-pad)', position:'relative', zIndex:2 }}>

        {/* Hero */}
        <div className="animate-in" style={{ textAlign:'center', padding:'4.5rem 0 3.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'var(--accent-soft)', border:'1px solid rgba(79,70,229,.18)', borderRadius:'20px', padding:'5px 16px', marginBottom:'1.5rem', backdropFilter:'blur(8px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--teal)', display:'inline-block', animation:'tealPing 2s ease-in-out infinite' }} />
            <style>{`@keyframes tealPing{0%,100%{box-shadow:0 0 0 0 rgba(8,145,178,.4)}50%{box-shadow:0 0 0 6px transparent}}`}</style>
            <span style={{ fontSize:'.74rem', fontWeight:700, color:'var(--accent-text)', letterSpacing:'.05em', textTransform:'uppercase' }}>
              No accounts · No names · No tracking
            </span>
          </div>

          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2.2rem,7vw,4.2rem)', fontWeight:700, letterSpacing:'-.04em', lineHeight:1.05, color:'var(--text-primary)', marginBottom:'1.25rem' }}>
            Ask anything.<br />
            <em style={{ color:'var(--accent)' }}>Hear the truth.</em>
          </h1>

          <p style={{ fontSize:'clamp(.95rem,2.5vw,1.1rem)', color:'var(--text-secondary)', maxWidth:'440px', margin:'0 auto 2.5rem', lineHeight:1.75 }}>
            Drop a link in WhatsApp. Your group responds honestly — no names attached, no accounts needed.
          </p>

          <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
            {user
              ? <Link to="/dashboard" className="btn btn-primary" style={{ padding:'12px 30px', fontSize:'.9375rem' }}>Open dashboard →</Link>
              : <>
                  <Link to="/login" className="btn btn-primary" style={{ padding:'12px 30px', fontSize:'.9375rem' }}>Get started free →</Link>
                  <Link to="/create/openfloor" className="btn" style={{ padding:'12px 30px', fontSize:'.9375rem' }}>Try it now</Link>
                </>}
          </div>
        </div>

        <InstallPrompt />

        {/* Session grid */}
        <div style={{ marginBottom:'4rem' }}>
          <p style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-faint)', marginBottom:'1.25rem', textAlign:'center' }}>
            Pick a format
          </p>

          <div className="session-grid">
            {(Object.entries(SESSION_TYPES) as [SessionType, typeof SESSION_TYPES[SessionType]][]).map(([key, t], i) => {
              const Icon = SESSION_ICONS[key]
              const colors = getTypeColors(key, isDark)
              const accent = TYPE_ACCENT[key]
              return (
                <Link key={key} to={`/create/${key}`}
                  className="animate-in"
                  style={{ animationDelay:`${i*.06}s`, textDecoration:'none', display:'flex', flexDirection:'column', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.1rem 1rem 1rem', boxShadow:'var(--shadow-sm)', transition:'all .22s cubic-bezier(.22,1,.36,1)', position:'relative', overflow:'hidden', gap:'10px' } as React.CSSProperties}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(-5px)'; el.style.boxShadow=`var(--shadow-lg), 0 0 0 1px ${accent}30`; el.style.borderColor=`${accent}35` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='var(--shadow-sm)'; el.style.borderColor='var(--border)' }}
                >
                  {/* Top colour stripe */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:accent, opacity:.75, borderRadius:'var(--radius-lg) var(--radius-lg) 0 0' }} />
                  {/* Icon pill */}
                  <div style={{ width:42, height:42, borderRadius:12, background:colors.bg, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 0 1px ${colors.glow}` }}>
                    <Icon size={22} color={colors.icon} strokeWidth={2} />
                  </div>
                  <div>
                    <p style={{ fontSize:'.875rem', fontWeight:600, color:'var(--text-primary)', letterSpacing:'-.01em', marginBottom:'3px' }}>{t.label}</p>
                    <p style={{ fontSize:'.74rem', color:'var(--text-muted)', lineHeight:1.45 }}>{t.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="card animate-in-d3" style={{ marginBottom:'4rem' }}>
          <p className="section-label" style={{ marginBottom:'1.5rem' }}>How it works</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1.5rem' }}>
            {[
              { n:'01', title:'Pick your format', desc:'Six types — from quick polls to live group chat. Each one built for a different kind of conversation.' },
              { n:'02', title:'Share the link',   desc:'Paste it in WhatsApp, post to your status, or show a QR code. No app download for your group.' },
              { n:'03', title:'Read the truth',   desc:"People say things anonymously they'd never say out loud. That's kind of the point." },
            ].map(s => (
              <div key={s.n} style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:700, color:'var(--accent)', letterSpacing:'-.04em', lineHeight:1, flexShrink:0, fontStyle:'italic', opacity:.4 }}>{s.n}</p>
                <div>
                  <p style={{ fontWeight:600, fontSize:'.875rem', color:'var(--text-primary)', marginBottom:'4px', lineHeight:1.3 }}>{s.title}</p>
                  <p style={{ fontSize:'.8rem', color:'var(--text-muted)', lineHeight:1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Credit />
    </div>
  )
}
