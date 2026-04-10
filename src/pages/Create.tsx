import { useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { SessionType, SurveyQuestion, QuestionType } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import Credit from '../components/Credit'

const Q_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'short',  label: 'Short answer',     icon: '—' },
  { value: 'long',   label: 'Long answer',       icon: '¶' },
  { value: 'choice', label: 'Multiple choice',   icon: '○' },
  { value: 'rating', label: 'Star rating (1–5)', icon: '★' },
  { value: 'yesno',  label: 'Yes / No',          icon: '✓' },
]
function newQ(): SurveyQuestion { return { id: crypto.randomUUID(), text: '', type: 'short', options: ['',''], required: true } }

const TYPE_BG: Record<string, string> = {
  ideas:'#3B82F6', suggestions:'#10B981', discussion:'#8B5CF6',
  poll:'#F59E0B', ama:'#6B7280', feedback:'#EC4899',
  catchup:'#6366F1', survey:'#0EA5E9',
}

export default function Create() {
  const { type = 'ideas' } = useParams<{ type: string }>()
  const sessionType = type as SessionType
  const typeInfo = SESSION_TYPES[sessionType]
  const accentColor = TYPE_BG[sessionType] ?? '#4F46E5'

  const navigate = useNavigate()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [cats, setCats] = useState('')
  const [pollOptions, setPollOptions] = useState(['',''])
  const [surveyQs, setSurveyQs] = useState<SurveyQuestion[]>([newQ()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setPreviewUrl(URL.createObjectURL(file)); setCoverImage(''); setUploadErr(''); setUploading(true)
    const fn = `cover_${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('covers').upload(fn, file, { upsert: true })
    if (upErr) { setUploadErr('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('covers').getPublicUrl(fn)
    setCoverImage(data.publicUrl); setUploading(false)
  }

  function updateQ(id: string, patch: Partial<SurveyQuestion>) { setSurveyQs(p => p.map(q => q.id === id ? { ...q, ...patch } : q)) }
  function updateQOpt(qid: string, oi: number, val: string) { setSurveyQs(p => p.map(q => q.id === qid ? { ...q, options: q.options?.map((o, i) => i === oi ? val : o) } : q)) }
  function addQOpt(qid: string) { setSurveyQs(p => p.map(q => q.id === qid && (q.options?.length ?? 0) < 8 ? { ...q, options: [...(q.options ?? []), ''] } : q)) }
  function removeQOpt(qid: string, oi: number) { setSurveyQs(p => p.map(q => q.id === qid && (q.options?.length ?? 0) > 2 ? { ...q, options: q.options?.filter((_, i) => i !== oi) } : q)) }
  function moveQ(id: string, dir: -1|1) {
    const idx = surveyQs.findIndex(q => q.id === id); const ni = idx + dir
    if (ni < 0 || ni >= surveyQs.length) return
    const a = [...surveyQs]; [a[idx], a[ni]] = [a[ni], a[idx]]; setSurveyQs(a)
  }

  async function create() {
    if (!title.trim()) { setError('Please enter a title.'); return }
    if (sessionType === 'poll' && pollOptions.filter(o => o.trim()).length < 2) { setError('Add at least 2 options.'); return }
    if (sessionType === 'survey' && surveyQs.find(q => !q.text.trim())) { setError('All questions need text.'); return }
    if (uploading) { setError('Wait for image upload to finish.'); return }
    setLoading(true); setError('')
    const categories = cats.trim() ? cats.split(',').map(c => c.trim()).filter(Boolean) : ['General']
    const adminToken = crypto.randomUUID()
    const { data, error: err } = await supabase.from('sessions').insert({
      title: title.trim(), description: description.trim(), type: sessionType, categories,
      poll_options: sessionType === 'poll' ? pollOptions.filter(o => o.trim()) : [],
      survey_questions: sessionType === 'survey' ? surveyQs : [],
      admin_token: adminToken,
      allow_reactions: !['poll','survey'].includes(sessionType),
      allow_replies: false, cover_image: coverImage, user_id: user?.id ?? null,
    }).select().single()
    if (err || !data) { setError('Failed to create. ' + err?.message); setLoading(false); return }
    localStorage.setItem(`admin_${data.id}`, adminToken)
    navigate(`/admin/${data.id}`)
  }

  const displayPreview = previewUrl || coverImage
  const isPoll = sessionType === 'poll'
  const isSurvey = sessionType === 'survey'
  const isCatchUp = sessionType === 'catchup'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', zIndex: 1 }}>

      {/* Topbar */}
      <header className="topbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="wordmark">Whi<em>spr</em></span>
        </Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          {user ? <Link to="/dashboard" className="btn btn-sm">My sessions</Link>
                : <Link to="/login" className="btn btn-sm">Sign in</Link>}
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem var(--page-pad) 6rem' }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem' }}
          className="animate-in">
          ← All session types
        </Link>

        {/* Session type hero */}
        <div className="animate-in" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: `linear-gradient(135deg, ${accentColor}14, ${accentColor}06)`, border: `1px solid ${accentColor}22`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '5rem', opacity: 0.08, lineHeight: 1 }}>{typeInfo?.icon}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${accentColor}18`, borderRadius: '20px', padding: '3px 12px', marginBottom: '10px', border: `1px solid ${accentColor}28` }}>
            <span style={{ fontSize: '1rem' }}>{typeInfo?.icon}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{typeInfo?.label}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '6px' }}>
            {isPoll ? 'Create a Poll' : isSurvey ? 'Build a Survey' : isCatchUp ? 'Start a Chat Room' : `New ${typeInfo?.label} Session`}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{typeInfo?.desc}</p>
        </div>

        {!isConfigured && (
          <div style={{ background: 'var(--amber-soft)', border: '1px solid rgba(217,119,6,.25)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '14px', fontSize: '.84rem', color: 'var(--amber-text)', lineHeight: 1.6 }}>
            ⚠️ Add Supabase env vars to your <code>.env</code> file.
          </div>
        )}

        {/* Form card */}
        <div className="card animate-in-d1" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Title */}
            <div className="field">
              <label>Title {isPoll ? '/ Question' : ''}</label>
              <input type="text"
                placeholder={isSurvey ? 'e.g. Product Feedback Survey Q2' : isPoll ? 'e.g. Which feature should we ship next?' : isCatchUp ? 'e.g. Friday Night Hangout 🎉' : 'e.g. What should we improve?'}
                value={title} onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isSurvey && !isPoll && create()} />
            </div>

            {/* Description */}
            <div className="field">
              <label>Description <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input type="text" placeholder="Give your group more context..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Poll options */}
            {isPoll && (
              <div className="field">
                <label>Poll Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pollOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border-lg)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)' }} />
                      </div>
                      <input type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => setPollOptions(p => p.map((o, idx) => idx === i ? e.target.value : o))}
                        style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '.9rem', outline: 'none' }} />
                      {pollOptions.length > 2 && <button onClick={() => setPollOptions(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '2px' }}>×</button>}
                    </div>
                  ))}
                  {pollOptions.length < 8 && <button className="btn btn-sm btn-ghost" onClick={() => setPollOptions(p => [...p, ''])} style={{ alignSelf: 'flex-start' }}>+ Add option</button>}
                </div>
              </div>
            )}

            {/* Survey question builder */}
            {isSurvey && (
              <div className="field">
                <label>Questions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {surveyQs.map((q, qi) => (
                    <div key={q.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-md)', padding: '14px', boxShadow: 'var(--shadow-xs)' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: accentColor, fontWeight: 700, fontSize: '.9rem', flexShrink: 0 }}>Q{qi+1}</span>
                        <input type="text" placeholder="Question text..." value={q.text} onChange={e => updateQ(q.id, { text: e.target.value })}
                          style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '.875rem', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: q.type === 'choice' ? '10px' : 0 }}>
                        <select value={q.type} onChange={e => updateQ(q.id, { type: e.target.value as QuestionType })}
                          style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '5px 28px 5px 10px', fontSize: '.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', outline: 'none', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%23888880' d='M0 0l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', cursor: 'pointer' }}>
                          {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          <input type="checkbox" checked={q.required} onChange={e => updateQ(q.id, { required: e.target.checked })} style={{ accentColor }} />
                          Required
                        </label>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                          <button className="btn btn-xs btn-ghost" onClick={() => moveQ(q.id, -1)} disabled={qi === 0}>↑</button>
                          <button className="btn btn-xs btn-ghost" onClick={() => moveQ(q.id, 1)} disabled={qi === surveyQs.length - 1}>↓</button>
                          <button className="btn btn-xs btn-danger" onClick={() => { if (surveyQs.length > 1) setSurveyQs(p => p.filter(x => x.id !== q.id)) }}>×</button>
                        </div>
                      </div>
                      {q.type === 'choice' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {q.options?.map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid var(--border-lg)', flexShrink: 0 }} />
                              <input type="text" placeholder={`Option ${oi+1}`} value={opt} onChange={e => updateQOpt(q.id, oi, e.target.value)}
                                style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '5px 10px', fontSize: '.84rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' }} />
                              {(q.options?.length ?? 0) > 2 && <button onClick={() => removeQOpt(q.id, oi)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>}
                            </div>
                          ))}
                          {(q.options?.length ?? 0) < 8 && <button className="btn btn-xs btn-ghost" onClick={() => addQOpt(q.id)} style={{ alignSelf: 'flex-start', marginTop: '2px' }}>+ option</button>}
                        </div>
                      )}
                    </div>
                  ))}
                  <button className="btn btn-sm" onClick={() => setSurveyQs(p => [...p, newQ()])} style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}>+ Add question</button>
                </div>
              </div>
            )}

            {/* Categories */}
            {!isPoll && !isSurvey && !isCatchUp && (
              <div className="field">
                <label>Categories <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input type="text" placeholder="e.g. Design, Tech, Marketing" value={cats} onChange={e => setCats(e.target.value)} />
                <span className="hint">Comma-separated. Helps you filter responses later.</span>
              </div>
            )}

            {/* Cover image */}
            <div className="field">
              <label>Cover Image <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              {!displayPreview ? (
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ width: '100%', padding: '22px 16px', border: '2px dashed var(--border-md)', borderRadius: 'var(--radius-md)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', transition: 'all .15s' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = accentColor; el.style.color = accentColor }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-md)'; el.style.color = 'var(--text-muted)' }}>
                  <span style={{ fontSize: '1.6rem' }}>🖼️</span>
                  <p style={{ fontWeight: 600, fontSize: '.875rem' }}>Choose from your device</p>
                  <p style={{ fontSize: '.75rem' }}>Gallery · Camera roll · Files</p>
                </button>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img src={displayPreview} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'block', boxShadow: 'var(--shadow-md)' }} />
                  {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.75)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span className="spinner" /><p style={{ fontSize: '.8rem' }}>Uploading...</p></div>}
                  {!uploading && coverImage && <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--green)', color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>✓ Uploaded</div>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>Change</button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => { setCoverImage(''); setPreviewUrl(''); if (fileRef.current) fileRef.current.value = '' }}>Remove</button>
                  </div>
                </div>
              )}
              {uploadErr && <p className="error-text">{uploadErr}</p>}
            </div>
          </div>

          {!user && (
            <div style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '16px', fontSize: '.84rem', color: 'var(--accent-text)', border: '1px solid rgba(79,70,229,.15)', lineHeight: 1.6 }}>
              💡 <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link> to save sessions to your dashboard and track them anytime.
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary btn-full" style={{ marginTop: '1.25rem', padding: '13px' }} onClick={create} disabled={loading || uploading}>
            {loading ? <><span className="spinner spinner-white" /> Creating...</> : `Create ${typeInfo?.label} session →`}
          </button>
        </div>
      </main>

      <Credit />
    </div>
  )
}
