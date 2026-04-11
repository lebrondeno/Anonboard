import { useEffect, useRef, useState } from 'react'
// @ts-ignore
import QRCode from 'qrcode'

interface Props { url: string; title: string; onClose: () => void }

export default function QRModal({ url, title, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0A0A0A',
        light: '#FFFFFF',
      },
    }).catch(console.error)
  }, [url])

  function download() {
    const canvas = canvasRef.current; if (!canvas) return
    // Add title text above QR
    const out = document.createElement('canvas')
    out.width = 320; out.height = 380
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 320, 380)
    // Draw QR centered
    ctx.drawImage(canvas, 20, 60, 280, 280)
    // Title
    ctx.fillStyle = '#0A0A0A'
    ctx.font = '600 15px DM Sans, system-ui'
    ctx.textAlign = 'center'
    const words = title.split(' ')
    let line = ''; const lines: string[] = []
    words.forEach(w => {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > 290 && line) { lines.push(line); line = w }
      else line = test
    })
    if (line) lines.push(line)
    lines.forEach((l, i) => ctx.fillText(l, 160, 20 + i * 20))
    // Whispr branding
    ctx.fillStyle = '#4F46E5'; ctx.font = 'italic 700 14px Instrument Serif, Georgia'
    ctx.fillText('Whispr', 160, 360)
    const a = document.createElement('a'); a.download = `whispr_qr_${Date.now()}.png`
    a.href = out.toDataURL('image/png', 1); a.click()
  }

  function copyUrl() {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '360px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-md)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>QR Code</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {/* QR canvas */}
          <div style={{ padding: '14px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, maxWidth: '260px' }}>
            Scan to open · Screenshot and share anywhere — WhatsApp, presentations, printed flyers.
          </p>

          {/* URL */}
          <div className="link-box" style={{ width: '100%' }}>
            <span className="link-text">{url}</span>
            <button className="btn btn-sm" onClick={copyUrl}>{copied ? '✓' : 'Copy'}</button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button className="btn btn-primary btn-full" onClick={download}>⬇ Download PNG</button>
          </div>
        </div>
      </div>
    </div>
  )
}
