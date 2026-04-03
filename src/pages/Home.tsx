import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { SessionType } from '../lib/supabase'
import Credit from '../components/Credit'
import InstallPrompt from '../components/InstallPrompt'
import ThemeToggle from '../components/ThemeToggle'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [type, setType] = useState<SessionType>('ideas')
  const [cats, setCats] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setCoverImage(''); setUploadError(''); setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `cover_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('covers').upload(filename, file, { upsert: true })
    if (upErr) { setUploadError('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('covers').getPublicUrl(filename)
    setCoverImage(data.publicUrl); setUploading(false)
  }

  function removeImage() {
    setCoverImage(''); setPreviewUrl(''); setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function updatePollOption(i: number, val: string) {
    setPollOptions(prev => prev.map((o, idx) => idx === i ? val : o))
  }
  function addPollOption() { if (pollOptions.length < 8) setPollOptions(prev => [...prev, '']) }
  function removePollOption(i: number) { if (pollOptions.length > 2) setPollOptions(prev => prev.filter((_, idx) => idx !== i)) }

  async function createSession() {
    if (!title.trim()) { setError('Please enter a title.'); return }
    if (type === 'poll') {
      const valid = pollOptions.filter(o => o.trim())
      if (valid.length < 2) { setError('Add at least 2 poll options.'); return }
    }
    if (uploading) { setError('Wait for image upload to finish.'); return }
    setLoading(true); setError('')

    const categories = cats.trim() ? cats.split(',').map(c => c.trim()).filter(Boolean) : ['General']
    const adminToken = crypto.randomUUID()
    const validPollOptions = pollOptions.filter(o => o.trim())

    const { data, error: err } = await supabase.from('sessions').insert({
      title: title.trim(), description: description.trim(), type, categories,
      poll_options: type === 'poll' ? validPollOptions : [],
      admin_token: adminToken, allow_reactions: type !== 'poll',
      allow_replies: false, cover_image: coverImage, user_id: user?.id ?? null,
    }).select().single()

    if (err || !data) { setError('Failed to create session. ' + err?.message); setLoading(false); return }
    localStorage.setItem(`admin_${data.id}`, adminToken)
    navigate(`/admin/${data.id}`)
  }

  const displayPreview = previewUrl || coverImage

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }} className="animate-in">
        <div>
          <p className="wordmark">Whispr</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            Anonymous feedback, anywhere.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />
          {user
            ? <Link to="/dashboard" className="btn btn-sm">My sessions ↗</Link>
            : <Link to="/login" className="btn btn-sm">Admin login</Link>
          }
        </div>
      </div>

      <InstallPrompt />

      {!isConfigured && (
        <div style={{ background: 'var(--amber-soft)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '14px', fontSize: '0.84rem', color: 'var(--amber-text)', lineHeight: 1.6 }}>
          ⚠️ Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file.
        </div>
      )}

      {/* Session type */}
      <div className="card animate-in-d1" style={{ marginBottom: '12px' }}>
        <p className="section-label" style={{ marginBottom: '14px' }}>Session type</p>
        <div className="type-grid">
          {(Object.entries(SESSION_TYPES) as [SessionType, typeof SESSION_TYPES[SessionType]][]).map(([key, t]) => (
            <div key={key} className={`type-card${type === key ? ' selected' : ''}`} onClick={() => setType(key)}>
              <span className="type-icon">{t.icon}</span>
              <p className="type-label">{t.label}</p>
              <p className="type-desc">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="card animate-in-d2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label>Title / Question</label>
            <input type="text"
              placeholder={type === 'poll' ? 'e.g. Which feature should we build next?' : type === 'ama' ? 'e.g. Ask me anything about our roadmap' : 'e.g. What should we improve?'}
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createSession()} />
          </div>

          <div className="field">
            <label>Description <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input type="text" placeholder="Give your group more context..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Poll options builder */}
          {type === 'poll' && (
            <div className="field">
              <label>Poll Options</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => updatePollOption(i, e.target.value)}
                      style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => removePollOption(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', lineHeight: 1 }}>×</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 8 && (
                  <button className="btn btn-sm btn-ghost" onClick={addPollOption} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                    + Add option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Categories (not for poll) */}
          {type !== 'poll' && (
            <div className="field">
              <label>Categories <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input type="text" placeholder="e.g. Design, Tech, Marketing" value={cats} onChange={e => setCats(e.target.value)} />
              <span className="hint">Comma-separated. Helps filter responses.</span>
            </div>
          )}

          {/* Cover image */}
          <div className="field">
            <label>Cover Image <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {!displayPreview ? (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '24px 16px', border: '2px dashed var(--border-md)', borderRadius: 'var(--radius-md)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.15s', color: 'var(--text-muted)' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--accent)'; el.style.background = 'var(--accent-soft)'; el.style.color = 'var(--accent-text)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-md)'; el.style.background = 'var(--bg2)'; el.style.color = 'var(--text-muted)' }}
              >
                <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Choose a photo from your device</p>
                <p style={{ fontSize: '0.76rem' }}>Camera roll, gallery or files</p>
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <img src={displayPreview} alt="Cover preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'block' }} />
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,15,0.7)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="spinner" /><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Uploading...</p>
                  </div>
                )}
                {!uploading && coverImage && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(52,211,153,0.9)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>✓ Uploaded</div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>Change</button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={removeImage}>Remove</button>
                </div>
              </div>
            )}
            {uploadError && <p className="error-text">{uploadError}</p>}
          </div>
        </div>

        {!user && (
          <div style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '16px', fontSize: '0.84rem', color: 'var(--accent-text)', border: '1px solid rgba(124,111,247,0.2)' }}>
            💡 <Link to="/login" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Log in</Link> to save sessions and track them anytime.
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={createSession} disabled={loading || uploading}>
          {loading ? <><span className="spinner spinner-white" /> Creating...</> : `Create ${SESSION_TYPES[type].label} session →`}
        </button>
      </div>

      <Credit />
    </div>
  )
}
