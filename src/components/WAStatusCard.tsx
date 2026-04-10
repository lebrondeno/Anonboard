import { useRef, useState, useEffect } from 'react'
import type { Session } from '../lib/supabase'

interface Props { session: Session; shareUrl: string; onClose: () => void }

const THEMES = [
  { id: 'midnight', label: 'Midnight', overlay: ['#0f0c29','#302b63','#1a1a2e'], text: '#ffffff', accent: '#818CF8' },
  { id: 'aurora',   label: 'Aurora',   overlay: ['#4F46E5','#7C3AED','#EC4899'], text: '#ffffff', accent: '#FDE68A' },
  { id: 'sunset',   label: 'Sunset',   overlay: ['#F97316','#EF4444','#DC2626'], text: '#ffffff', accent: '#FEF3C7' },
  { id: 'forest',   label: 'Forest',   overlay: ['#064E3B','#065F46','#047857'], text: '#ffffff', accent: '#6EE7B7' },
  { id: 'paper',    label: 'Paper',    overlay: ['#FAFAF8','#F5F4F0','#E8E7E2'], text: '#0A0A0A', accent: '#4F46E5' },
]

const PROMPTS = [
  'What do you really think of me? 👀',
  'Drop your honest opinion anonymously 🤫',
  'Tell me what you truly think 💬',
  'Anonymous feedback wanted 🎯',
  'What\'s your honest take on this? 🔥',
]

export default function WAStatusCard({ session, shareUrl, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [theme, setTheme] = useState(THEMES[0])
  const [prompt, setPrompt] = useState(PROMPTS[0])
  const [customPrompt, setCustomPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const [rendering, setRendering] = useState(false)

  const displayPrompt = customPrompt.trim() || prompt

  useEffect(() => { renderCard() }, [theme, displayPrompt, session])

  async function renderCard() {
    const canvas = canvasRef.current; if (!canvas) return
    setRendering(true)
    const ctx = canvas.getContext('2d')!
    const W = 540, H = 960
    canvas.width = W; canvas.height = H

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W * 0.7, H)
    theme.overlay.forEach((c, i) => grad.addColorStop(i / (theme.overlay.length - 1), c))
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)

    // Cover photo
    if (session.cover_image) {
      await new Promise<void>(resolve => {
        const img = new Image(); img.crossOrigin = 'anonymous'
        img.onload = () => {
          // Draw image centered + cropped
          const scale = Math.max(W / img.width, H * 0.5 / img.height)
          const sw = img.width * scale, sh = img.height * scale
          const sx = (W - sw) / 2, sy = 0
          ctx.drawImage(img, sx, sy, sw, sh)
          // Dark overlay on image
          const imgGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55)
          imgGrad.addColorStop(0, 'rgba(0,0,0,0)')
          imgGrad.addColorStop(1, 'rgba(0,0,0,0.85)')
          ctx.fillStyle = imgGrad; ctx.fillRect(0, 0, W, H * 0.55)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = session.cover_image
      })
    }

    // Bottom gradient panel
    const bottomGrad = ctx.createLinearGradient(0, H * 0.45, 0, H)
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)')
    theme.overlay.forEach((c, i) => bottomGrad.addColorStop(0.15 + (i / (theme.overlay.length - 1)) * 0.85, c + 'FF'))
    ctx.fillStyle = bottomGrad; ctx.fillRect(0, H * 0.45, W, H * 0.55)

    // Noise texture overlay
    ctx.save(); ctx.globalAlpha = 0.035
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      if (Math.random() > 0.5) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1) }
    }
    ctx.restore()

    // Wordmark top-left
    ctx.save()
    ctx.font = `italic 700 32px 'Instrument Serif', Georgia, serif`
    ctx.fillStyle = theme.text; ctx.globalAlpha = 0.9
    ctx.fillText('Whispr', 44, 72)
    ctx.restore()

    // Accent dot next to wordmark
    ctx.beginPath(); ctx.arc(130, 62, 5, 0, Math.PI * 2)
    ctx.fillStyle = theme.accent; ctx.fill()

    // Session title (if no cover image, show it prominently)
    if (!session.cover_image) {
      ctx.save()
      ctx.font = `700 clamp(28px,5vw,42px) 'DM Sans', system-ui`
      ctx.fillStyle = theme.text; ctx.globalAlpha = 0.95
      ctx.textAlign = 'center'
      const lines = wrapText(ctx, session.title, W - 80, 42)
      lines.forEach((line, i) => ctx.fillText(line, W / 2, H * 0.4 + i * 52))
      ctx.restore()
    }

    // Main prompt text
    const promptY = H * 0.58
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = `600 34px 'DM Sans', system-ui`
    ctx.fillStyle = theme.text; ctx.globalAlpha = 0.97
    const promptLines = wrapText(ctx, displayPrompt, W - 80, 34)
    promptLines.forEach((line, i) => ctx.fillText(line, W / 2, promptY + i * 46))
    ctx.restore()

    // Divider line
    const divY = promptY + promptLines.length * 46 + 28
    ctx.save(); ctx.globalAlpha = 0.25
    ctx.strokeStyle = theme.text; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(80, divY); ctx.lineTo(W - 80, divY); ctx.stroke()
    ctx.restore()

    // URL pill
    const pillY = divY + 44
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, 60, pillY - 26, W - 120, 48, 24); ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.textAlign = 'center'; ctx.font = `500 18px monospace`
    ctx.fillStyle = theme.text; ctx.globalAlpha = 0.85
    ctx.fillText(shareUrl.replace('https://', ''), W / 2, pillY + 8)
    ctx.restore()

    // Anonymous badge
    const badgeY = pillY + 58
    ctx.save()
    ctx.textAlign = 'center'; ctx.font = `500 16px 'DM Sans', system-ui`
    ctx.fillStyle = theme.accent; ctx.globalAlpha = 0.9
    ctx.fillText('🔒 100% anonymous · No account needed', W / 2, badgeY)
    ctx.restore()

    // Bottom credit
    ctx.save()
    ctx.textAlign = 'center'; ctx.font = `italic 400 16px 'Instrument Serif', Georgia`
    ctx.fillStyle = theme.text; ctx.globalAlpha = 0.4
    ctx.fillText('made by lebrondeno', W / 2, H - 40)
    ctx.restore()

    setRendering(false)
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, fontSize: number): string[] {
    ctx.font = `600 ${fontSize}px 'DM Sans', system-ui`
    const words = text.split(' '); const lines: string[] = []; let cur = ''
    words.forEach(w => {
      const test = cur ? `${cur} ${w}` : w
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w }
      else cur = test
    })
    if (cur) lines.push(cur)
    return lines
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
  }

  function download() {
    const canvas = canvasRef.current; if (!canvas) return
    const a = document.createElement('a'); a.download = `whispr_status_${Date.now()}.png`
    a.href = canvas.toDataURL('image/png', 0.95); a.click()
  }

  function copyCaption() {
    navigator.clipboard.writeText(`${displayPrompt}\n\n${shareUrl}`).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-md)' }}
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>WhatsApp Status Card</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Share this to your status with the link as caption</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Canvas preview — 9:16 aspect */}
          <div style={{ width: '100%', aspectRatio: '9/16', maxHeight: '340px', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative', border: '1px solid var(--border)' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {rendering && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)' }}><span className="spinner spinner-white" /></div>}
          </div>

          {/* Theme picker */}
          <div>
            <p className="section-label" style={{ marginBottom: '8px' }}>Theme</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t)}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${theme.id === t.id ? 'var(--accent)' : 'var(--border-md)'}`, background: theme.id === t.id ? 'var(--accent-soft)' : 'var(--surface2)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, color: theme.id === t.id ? 'var(--accent-text)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', transition: 'all .15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt picker */}
          <div>
            <p className="section-label" style={{ marginBottom: '8px' }}>Prompt text</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              {PROMPTS.map(p => (
                <button key={p} onClick={() => { setPrompt(p); setCustomPrompt('') }}
                  style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${prompt === p && !customPrompt ? 'var(--accent)' : 'var(--border)'}`, background: prompt === p && !customPrompt ? 'var(--accent-soft)' : 'var(--surface2)', cursor: 'pointer', fontSize: '.84rem', color: prompt === p && !customPrompt ? 'var(--accent-text)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', textAlign: 'left', fontWeight: 400, lineHeight: 1.4, transition: 'all .15s' }}>
                  {p}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Or type your own prompt..." value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '9px 14px', fontSize: '.875rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={download}>⬇ Download image</button>
            <button className="btn btn-green" style={{ flex: 1 }} onClick={copyCaption}>
              {copied ? '✓ Copied!' : '📋 Copy caption'}
            </button>
          </div>

          <p style={{ fontSize: '.76rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            Download the image → Post to WhatsApp status → The caption is already copied, just paste it.
          </p>
        </div>
      </div>
    </div>
  )
}
