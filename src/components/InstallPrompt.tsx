import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Don't show if already running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  if (installed || dismissed || !prompt) return null

  return (
    <div className="animate-in" style={{
      background: 'var(--accent-soft)',
      border: '1px solid rgba(124,111,247,0.3)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📲</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-text)' }}>Install Whispr</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Add to your home screen for instant access
        </p>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button className="btn btn-sm btn-primary" onClick={install}>Install</button>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setDismissed(true)}
          style={{ fontSize: '1rem', padding: '4px 8px' }}
        >×</button>
      </div>
    </div>
  )
}
