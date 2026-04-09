import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { SessionType, SurveyQuestion, QuestionType } from '../lib/supabase'
import Credit from '../components/Credit'
import InstallPrompt from '../components/InstallPrompt'
import ThemeToggle from '../components/ThemeToggle'

const Q_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'short',  label: 'Short answer',     icon: '—' },
  { value: 'long',   label: 'Long answer',       icon: '¶' },
  { value: 'choice', label: 'Multiple choice',   icon: '○' },
  { value: 'rating', label: 'Star rating (1–5)', icon: '★' },
  { value: 'yesno',  label: 'Yes / No',          icon: '✓' },
]

function newQuestion(): SurveyQuestion {
  return { id: crypto.randomUUID(), text: '', type: 'short', options: ['', ''], required: true }
}

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
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([newQuestion()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setPreviewUrl(URL.createObjectURL(file)); setCoverImage(''); setUploadError(''); setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `cover_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('covers').upload(filename, file, { upsert: true })
    if (upErr) { setUploadError('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('covers').getPublicUrl(filename)
    setCoverImage(data.publicUrl); setUploading(false)
  }

  function removeImage() { setCoverImage(''); setPreviewUrl(''); setUploadError(''); if (fileInputRef.current) fileInputRef.current.value = '' }
  function updatePollOption(i: number, val: string) { setPollOptions(prev => prev.map((o, idx) => idx === i ? val : o)) }

  // Survey helpers
  function updateQ(id: string, patch: Partial<SurveyQuestion>) {
    setSurveyQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))
  }
  function updateQOption(qid: string, oi: number, val: string) {
    setSurveyQuestions(prev => prev.map(q => q.id === qid ? { ...q, options: q.options?.map((o, i) => i === oi ? val : o) } : q))
  }
  function addQOption(qid: string) {
    setSurveyQuestions(prev => prev.map(q => q.id === qid && (q.options?.length ?? 0) < 8 ? { ...q, options: [...(q.options ?? []), ''] } : q))
  }
  function removeQOption(qid: string, oi: number) {
    setSurveyQuestions(prev => prev.map(q => q.id === qid && (q.options?.length ?? 0) > 2 ? { ...q, options: q.options?.filter((_, i) => i !== oi) } : q))
  }
  function removeQuestion(id: string) { if (surveyQuestions.length > 1) setSurveyQuestions(prev => prev.filter(q => q.id !== id)) }
  function moveQuestion(id: string, dir: -1 | 1) {
    const idx = surveyQuestions.findIndex(q => q.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= surveyQuestions.length) return
    const updated = [...surveyQuestions]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    setSurveyQuestions(updated)
  }

  async function createSession() {
    if (!title.trim()) { setError('Please enter a title.'); return }
    if (type === 'poll' && pollOptions.filter(o => o.trim()).length < 2) { setError('Add at least 2 poll options.'); return }
    if (type === 'survey') {
      const empty = surveyQuestions.find(q => !q.text.trim())
      if (empty) { setError('All survey questions need text.'); return }
    }
    if (uploading) { setError('Wait for image to finish uploading.'); return }
    setLoading(true); setError('')

    const categories = cats.trim() ? cats.split(',').map(c => c.trim()).filter(Boolean) : ['General']
    const adminToken = crypto.randomUUID()

    const { data, error: err } = await supabase.from('sessions').insert({
      title: title.trim(), description: description.trim(), type, categories,
      poll_options: type === 'poll' ? pollOptions.filter(o => o.trim()) : [],
      survey_questions: type === 'survey' ? surveyQuestions : [],
      admin_token: adminToken, allow_reactions: type !== 'poll' && type !== 'survey',
      allow_replies: false, cover_image: coverImage, user_id: user?.id ?? null,
    }).select().single()

    if (err || !data) { setError('Failed to create session. ' + err?.message); setLoading(false); return }
    localStorage.setItem(`admin_${data.id}`, adminToken)
    navigate(`/admin/${data.id}`)
  }

  const displayPreview = previewUrl || coverImage

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }} className="animate-in">
        <div>
          <p className="wordmark">Whi<em>spr</em></p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Anonymous feedback, ideas & conversations.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          {user ? <Link to="/dashboard" className="btn btn-sm">My sessions</Link>
                : <Link to="/login" className="btn btn-sm">Admin login</Link>}
        </div>
      </div>

      <InstallPrompt />

      {!isConfigured && (
        <div style={{ background: 'var(--amber-soft)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '14px', fontSize: '0.84rem', color: 'var(--amber-text)', lineHeight: 1.6 }}>
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
              placeholder={type === 'survey' ? 'e.g. Product Feedback Survey' : type === 'poll' ? 'e.g. Which feature should we build next?' : 'e.g. What should we improve?'}
              value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && type !== 'survey' && createSession()} />
          </div>

          <div className="field">
            <label>Description <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input type="text" placeholder="Give your group more context..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Poll options */}
          {type === 'poll' && (
            <div className="field">
              <label>Poll Options</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    </div>
                    <input type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => updatePollOption(i, e.target.value)}
                      style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none' }} />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', lineHeight: 1 }}>×</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 8 && (
                  <button className="btn btn-sm btn-ghost" onClick={() => setPollOptions(prev => [...prev, ''])} style={{ alignSelf: 'flex-start' }}>+ Add option</button>
                )}
              </div>
            </div>
          )}

          {/* Survey question builder */}
          {type === 'survey' && (
            <div className="field">
              <label>Survey Questions</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {surveyQuestions.map((q, qi) => (
                  <div key={q.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Question header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>Q{qi + 1}</span>
                      <input type="text" placeholder="Question text..." value={q.text} onChange={e => updateQ(q.id, { text: e.target.value })}
                        style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none' }} />
                    </div>

                    {/* Type + required row */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: q.type === 'choice' ? '10px' : '0', flexWrap: 'wrap' }}>
                      <select value={q.type} onChange={e => updateQ(q.id, { type: e.target.value as QuestionType })}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '6px 28px 6px 10px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', outline: 'none', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%23888884' d='M0 0l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
                        {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <input type="checkbox" checked={q.required} onChange={e => updateQ(q.id, { required: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                        Required
                      </label>

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                        <button onClick={() => moveQuestion(q.id, -1)} disabled={qi === 0} className="btn btn-xs btn-ghost" style={{ padding: '3px 7px' }}>↑</button>
                        <button onClick={() => moveQuestion(q.id, 1)} disabled={qi === surveyQuestions.length - 1} className="btn btn-xs btn-ghost" style={{ padding: '3px 7px' }}>↓</button>
                        <button onClick={() => removeQuestion(q.id)} className="btn btn-xs btn-danger" style={{ padding: '3px 7px' }}>×</button>
                      </div>
                    </div>

                    {/* Choice options */}
                    {q.type === 'choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q.options?.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border-lg)', flexShrink: 0 }} />
                            <input type="text" placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateQOption(q.id, oi, e.target.value)}
                              style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '6px 10px', fontSize: '0.84rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' }} />
                            {(q.options?.length ?? 0) > 2 && (
                              <button onClick={() => removeQOption(q.id, oi)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px', lineHeight: 1 }}>×</button>
                            )}
                          </div>
                        ))}
                        {(q.options?.length ?? 0) < 8 && (
                          <button className="btn btn-xs btn-ghost" onClick={() => addQOption(q.id)} style={{ alignSelf: 'flex-start', marginTop: '2px' }}>+ Add option</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button className="btn btn-sm" onClick={() => setSurveyQuestions(prev => [...prev, newQuestion()])}
                  style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}>
                  + Add question
                </button>
              </div>
            </div>
          )}

          {/* Categories (not for poll/survey/catchup) */}
          {type !== 'poll' && type !== 'survey' && type !== 'catchup' && (
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
                style={{ width: '100%', padding: '24px 16px', border: '2px dashed var(--border-md)', borderRadius: 'var(--radius-md)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--accent)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-md)'; el.style.color = 'var(--text-muted)' }}>
                <span style={{ fontSize: '1.75rem' }}>🖼️</span>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Choose a photo from your device</p>
                <p style={{ fontSize: '0.76rem' }}>Camera roll, gallery or files</p>
              </button>
            ) : (
              <div>
                <img src={displayPreview} alt="Cover preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'block', boxShadow: 'var(--shadow-md)' }} />
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="spinner" /><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Uploading...</p>
                  </div>
                )}
                {!uploading && coverImage && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--green)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>✓ Uploaded</div>
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
          <div style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '16px', fontSize: '0.84rem', color: 'var(--accent-text)', border: '1px solid rgba(79,70,229,0.15)' }}>
            💡 <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log in</Link> to save sessions and track them anytime.
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
