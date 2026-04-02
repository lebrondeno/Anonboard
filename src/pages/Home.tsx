import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { SessionType } from '../lib/supabase'
import Credit from '../components/Credit'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')        // final public URL saved to DB
  const [previewUrl, setPreviewUrl] = useState('')        // local blob for instant preview
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [type, setType] = useState<SessionType>('ideas')
  const [cats, setCats] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // instant local preview
    const blob = URL.createObjectURL(file)
    setPreviewUrl(blob)
    setCoverImage('')
    setUploadError('')
    setUploading(true)

    // upload to Supabase Storage bucket "covers"
    const ext = file.name.split('.').pop()
    const filename = `cover_${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(filename, file, { upsert: true })

    if (upErr) {
      setUploadError('Upload failed: ' + upErr.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('covers').getPublicUrl(filename)
    setCoverImage(data.publicUrl)
    setUploading(false)
  }

  function removeImage() {
    setCoverImage('')
    setPreviewUrl('')
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function createSession() {
    if (!title.trim()) { setError('Please enter a title for your session.'); return }
    if (uploading) { setError('Please wait for the image to finish uploading.'); return }
    setLoading(true); setError('')

    const categories = cats.trim()
      ? cats.split(',').map(c => c.trim()).filter(Boolean)
      : ['General']

    const adminToken = crypto.randomUUID()
    const { data, error: err } = await supabase
      .from('sessions')
      .insert({
        title: title.trim(),
        description: description.trim(),
        type,
        categories,
        admin_token: adminToken,
        allow_reactions: true,
        allow_replies: false,
        cover_image: coverImage,
        user_id: user?.id ?? null,
      })
      .select().single()

    if (err || !data) { setError('Failed to create session. Check Supabase connection.'); setLoading(false); return }
    localStorage.setItem(`admin_${data.id}`, adminToken)
    navigate(`/admin/${data.id}`)
  }

  const displayPreview = previewUrl || coverImage

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} className="animate-in">
        <div>
          <p className="wordmark">Whi<span>spr</span></p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Anonymous responses for any topic.
          </p>
        </div>
        <div style={{ marginTop: '4px' }}>
          {user
            ? <Link to="/dashboard" className="btn btn-sm">My sessions</Link>
            : <Link to="/login" className="btn btn-sm">Admin login</Link>
          }
        </div>
      </div>

      {!isConfigured && (
        <div style={{ background: '#fff8e1', border: '1px solid #f59e0b', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '14px', fontSize: '0.84rem', color: '#92400e', lineHeight: 1.6 }}>
          <strong>Setup required:</strong> Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file, then restart.
        </div>
      )}

      {/* Session type picker */}
      <div className="card animate-in-d1" style={{ marginBottom: '12px' }}>
        <p className="section-label" style={{ marginBottom: '14px' }}>What kind of session?</p>
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

      {/* Session details */}
      <div className="card animate-in-d2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div className="field">
            <label>Title / Question</label>
            <input
              type="text"
              placeholder={`e.g. ${type === 'ama' ? 'Ask me anything about startups' : type === 'discussion' ? 'What should we improve?' : type === 'poll' ? 'Best day for our meetup?' : 'Ideas for our next event'}`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createSession()}
            />
          </div>

          <div className="field">
            <label>Description <span style={{ fontWeight: 300, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input type="text" placeholder="Give your group more context..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* ── Cover image upload ── */}
          <div className="field">
            <label>Cover image <span style={{ fontWeight: 300, color: 'var(--text-muted)' }}>(optional)</span></label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {!displayPreview ? (
              /* Upload button / drop zone */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '28px 16px',
                  border: '2px dashed var(--border-md)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-md)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              >
                <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Tap to choose a photo</p>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>From your camera roll, gallery or files</p>
              </button>
            ) : (
              /* Preview + controls */
              <div style={{ position: 'relative' }}>
                <img
                  src={displayPreview}
                  alt="Cover preview"
                  style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'block' }}
                />
                {/* Uploading overlay */}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="spinner" />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Uploading...</p>
                  </div>
                )}
                {/* Done badge */}
                {!uploading && coverImage && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(30,122,74,0.9)', color: '#fff', fontSize: '0.74rem', fontWeight: 500, padding: '3px 10px', borderRadius: '20px' }}>
                    ✓ Uploaded
                  </div>
                )}
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>Change photo</button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={removeImage}>Remove</button>
                </div>
              </div>
            )}

            {uploadError && <p style={{ fontSize: '0.8rem', color: 'var(--red)', marginTop: '4px' }}>{uploadError}</p>}
          </div>

          <div className="field">
            <label>Categories <span style={{ fontWeight: 300, color: 'var(--text-muted)' }}>(comma-separated, optional)</span></label>
            <input type="text" placeholder="e.g. Design, Tech, Marketing" value={cats} onChange={e => setCats(e.target.value)} />
            <span className="hint">Helps you filter responses later.</span>
          </div>
        </div>

        {!user && (
          <div style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '14px', fontSize: '0.84rem', color: 'var(--accent-text)' }}>
            <strong style={{ fontWeight: 500 }}>Tip:</strong>{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Log in</Link>{' '}
            to save sessions to your dashboard and track them anytime.
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
