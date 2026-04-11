import { useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES, FRAMING_MODES, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { SessionType, SurveyQuestion, QuestionType, FramingMode } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import Credit from '../components/Credit'
import { SESSION_ICONS, TYPE_ACCENT } from '../components/SessionIcon'

const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value:'short',  label:'Short answer' },
  { value:'long',   label:'Long answer'  },
  { value:'choice', label:'Multiple choice' },
  { value:'rating', label:'Star rating (1–5)' },
  { value:'yesno',  label:'Yes / No' },
]
function newQ(): SurveyQuestion { return { id:crypto.randomUUID(), text:'', type:'short', options:['',''], required:true } }

export default function Create() {
  const { type = 'openfloor' } = useParams<{ type: string }>()
  const sessionType = (Object.keys(SESSION_TYPES).includes(type) ? type : 'openfloor') as SessionType
  const typeInfo = SESSION_TYPES[sessionType]
  const accent = TYPE_ACCENT[sessionType]

  const navigate = useNavigate()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  // Core fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [framingMode, setFramingMode] = useState<FramingMode>('ideas')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [surveyQs, setSurveyQs] = useState<SurveyQuestion[]>([newQ()])

  // Cover image
  const [coverImage, setCoverImage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  // Advanced settings
  const [advOpen, setAdvOpen] = useState(false)
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [memberTheme, setMemberTheme] = useState<'auto'|'light'|'dark'>('auto')
  const [cats, setCats] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isPoll = sessionType === 'poll'
  const isSurvey = sessionType === 'survey'
  const isCatchUp = sessionType === 'catchup'
  const isOpenFloor = sessionType === 'openfloor'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setPreviewUrl(URL.createObjectURL(file)); setCoverImage(''); setUploadErr(''); setUploading(true)
    const fn = `cover_${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('covers').upload(fn, file, { upsert:true })
    if (upErr) { setUploadErr('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('covers').getPublicUrl(fn)
    setCoverImage(data.publicUrl); setUploading(false)
  }

  function updateQ(id: string, patch: Partial<SurveyQuestion>) { setSurveyQs(p => p.map(q => q.id===id ? {...q,...patch} : q)) }
  function updateQOpt(qid: string, oi: number, val: string) { setSurveyQs(p => p.map(q => q.id===qid ? {...q, options:q.options?.map((o,i)=>i===oi?val:o)} : q)) }
  function addQOpt(qid: string) { setSurveyQs(p => p.map(q => q.id===qid && (q.options?.length??0)<8 ? {...q, options:[...(q.options??[]),'']} : q)) }
  function removeQOpt(qid: string, oi: number) { setSurveyQs(p => p.map(q => q.id===qid && (q.options?.length??0)>2 ? {...q, options:q.options?.filter((_,i)=>i!==oi)} : q)) }
  function moveQ(id: string, dir: -1|1) {
    const idx = surveyQs.findIndex(q=>q.id===id), ni = idx+dir
    if (ni<0||ni>=surveyQs.length) return
    const a=[...surveyQs]; [a[idx],a[ni]]=[a[ni],a[idx]]; setSurveyQs(a)
  }

  async function create() {
    if (!title.trim()) { setError('Give your session a title.'); return }
    if (isPoll && pollOptions.filter(o=>o.trim()).length < 2) { setError('Add at least 2 poll options.'); return }
    if (isSurvey && surveyQs.find(q=>!q.text.trim())) { setError('Every question needs text.'); return }
    if (uploading) { setError('Hold on — image still uploading.'); return }
    if (slug.trim() && !/^[a-z0-9-]+$/.test(slug.trim())) { setError('Slug: lowercase letters, numbers and hyphens only.'); return }
    if (pin.trim() && !/^\d{4}$/.test(pin.trim())) { setError('PIN must be exactly 4 digits.'); return }
    setLoading(true); setError('')

    const categories = cats.trim() ? cats.split(',').map(c=>c.trim()).filter(Boolean) : ['General']
    const adminToken = crypto.randomUUID()
    const { data, error: err } = await supabase.from('sessions').insert({
      title: title.trim(), description: description.trim(),
      type: sessionType,
      framing_mode: isOpenFloor ? framingMode : null,
      categories,
      poll_options: isPoll ? pollOptions.filter(o=>o.trim()) : [],
      survey_questions: isSurvey ? surveyQs : [],
      admin_token: adminToken,
      allow_reactions: !isPoll && !isSurvey,
      allow_replies: false,
      cover_image: coverImage,
      user_id: user?.id ?? null,
      is_closed: false, expires_at: null, max_responses: null,
      slug: slug.trim() || null,
      pin: pin.trim() || null,
      member_theme: memberTheme,
    }).select().single()

    if (err || !data) { setError("Couldn't create the session. " + err?.message); setLoading(false); return }
    localStorage.setItem(`admin_${data.id}`, adminToken)
    navigate(`/admin/${data.id}`)
  }

  const displayPreview = previewUrl || coverImage
  const Icon = SESSION_ICONS[sessionType]
  // Placeholder depends on framing
  const framingPlaceholder = isOpenFloor
    ? FRAMING_MODES[framingMode]?.placeholder
    : (isCatchUp ? 'e.g. Friday Night Hangout 🎉' : isPoll ? 'e.g. Which feature should we ship next?' : isSurvey ? 'e.g. Q2 Product Feedback Survey' : "What's on your mind?")

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', position:'relative', zIndex:1 }}>
      <header className="topbar">
        <Link to="/" style={{ textDecoration:'none' }}><span className="wordmark">Whi<em>spr</em></span></Link>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <ThemeToggle />
          {user ? <Link to="/dashboard" className="btn btn-sm">My sessions</Link>
                : <Link to="/login" className="btn btn-sm">Sign in</Link>}
        </div>
      </header>

      <main style={{ maxWidth:'600px', margin:'0 auto', padding:'2rem var(--page-pad) 6rem' }}>
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'.84rem', color:'var(--text-muted)', textDecoration:'none', marginBottom:'1.5rem' }} className="animate-in">
          ← All sessions
        </Link>

        {/* Type hero */}
        <div className="animate-in" style={{ marginBottom:'1.5rem', padding:'1.5rem', borderRadius:'var(--radius-xl)', background:`linear-gradient(135deg, ${accent}12, ${accent}05)`, border:`1px solid ${accent}20`, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-24, right:-24, opacity:.06 }}>
            <Icon size={120} color={accent} strokeWidth={1.5} />
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:`${accent}18`, borderRadius:'20px', padding:'4px 14px', marginBottom:'10px', border:`1px solid ${accent}25` }}>
            <Icon size={15} color={accent} strokeWidth={2.5} />
            <span style={{ fontSize:'.74rem', fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'.05em' }}>{typeInfo?.label}</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.3rem,4vw,1.75rem)', fontWeight:700, letterSpacing:'-.03em', color:'var(--text-primary)', lineHeight:1.2, marginBottom:'6px' }}>
            {isPoll ? 'Set up a poll' : isSurvey ? 'Build a survey' : isCatchUp ? 'Open a chat room' : isOpenFloor ? 'Start an open session' : 'Collect feedback'}
          </h1>
          <p style={{ fontSize:'.875rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{typeInfo?.desc}</p>
        </div>

        {!isConfigured && (
          <div style={{ background:'var(--amber-soft)', border:'1px solid rgba(217,119,6,.25)', borderRadius:'var(--radius-md)', padding:'10px 14px', marginBottom:'12px', fontSize:'.84rem', color:'var(--amber-text)' }}>
            ⚠️ Set up your Supabase credentials in <code>.env</code> to save sessions.
          </div>
        )}

        <div className="card animate-in-d1" style={{ marginBottom:'12px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

            {/* Open Floor framing mode */}
            {isOpenFloor && (
              <div>
                <p style={{ fontSize:'.74rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'10px' }}>What kind of Open Floor?</p>
                <div className="framing-grid">
                  {(Object.entries(FRAMING_MODES) as [FramingMode, typeof FRAMING_MODES[string]][]).map(([key, fm]) => (
                    <div key={key} className={`framing-card${framingMode===key?' selected':''}`} onClick={() => setFramingMode(key)}>
                      <p style={{ fontSize:'1.1rem', marginBottom:'4px' }}>{fm.icon}</p>
                      <p className="framing-label">{fm.label}</p>
                      <p className="framing-desc">{fm.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label>Title</label>
              <input type="text" placeholder={framingPlaceholder} value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !isSurvey && !isPoll && create()} />
            </div>

            <div className="field">
              <label>Description <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <input type="text" placeholder="A bit more context for your group..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Poll options */}
            {isPoll && (
              <div className="field">
                <label>Options</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {pollOptions.map((opt,i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', border:'2px solid var(--border-lg)', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--text-muted)' }} />
                      </div>
                      <input type="text" placeholder={`Option ${i+1}`} value={opt}
                        onChange={e => setPollOptions(p=>p.map((o,idx)=>idx===i?e.target.value:o))}
                        style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', padding:'8px 12px', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
                      {pollOptions.length>2 && <button onClick={()=>setPollOptions(p=>p.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.2rem', lineHeight:1 }}>×</button>}
                    </div>
                  ))}
                  {pollOptions.length<8 && <button className="btn btn-sm btn-ghost" onClick={()=>setPollOptions(p=>[...p,''])} style={{ alignSelf:'flex-start' }}>+ Add option</button>}
                </div>
              </div>
            )}

            {/* Survey builder */}
            {isSurvey && (
              <div className="field">
                <label>Questions</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {surveyQs.map((q,qi) => (
                    <div key={q.id} style={{ background:'var(--bg2)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-md)', padding:'14px' }}>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'10px', alignItems:'center' }}>
                        <span style={{ fontFamily:'var(--font-display)', fontStyle:'italic', color:accent, fontWeight:700, fontSize:'.9rem', flexShrink:0 }}>Q{qi+1}</span>
                        <input type="text" placeholder="What do you want to ask?" value={q.text}
                          onChange={e=>updateQ(q.id,{text:e.target.value})}
                          style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', padding:'7px 12px', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:'.875rem', outline:'none' }} />
                      </div>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:q.type==='choice'?'10px':0 }}>
                        <select value={q.type} onChange={e=>updateQ(q.id,{type:e.target.value as QuestionType})}
                          style={{ background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', padding:'5px 28px 5px 10px', fontSize:'.8rem', color:'var(--text-secondary)', fontFamily:'var(--font-body)', outline:'none', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%23666660' d='M0 0l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 8px center', cursor:'pointer' }}>
                          {Q_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <label style={{ display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', fontSize:'.8rem', color:'var(--text-muted)', fontWeight:500 }}>
                          <input type="checkbox" checked={q.required} onChange={e=>updateQ(q.id,{required:e.target.checked})} style={{ accentColor:accent }} />
                          Required
                        </label>
                        <div style={{ marginLeft:'auto', display:'flex', gap:'4px' }}>
                          <button className="btn btn-xs btn-ghost" onClick={()=>moveQ(q.id,-1)} disabled={qi===0}>↑</button>
                          <button className="btn btn-xs btn-ghost" onClick={()=>moveQ(q.id,1)} disabled={qi===surveyQs.length-1}>↓</button>
                          <button className="btn btn-xs btn-danger" onClick={()=>{if(surveyQs.length>1)setSurveyQs(p=>p.filter(x=>x.id!==q.id))}}>×</button>
                        </div>
                      </div>
                      {q.type==='choice' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                          {q.options?.map((opt,oi)=>(
                            <div key={oi} style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                              <div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid var(--border-lg)', flexShrink:0 }} />
                              <input type="text" placeholder={`Option ${oi+1}`} value={opt} onChange={e=>updateQOpt(q.id,oi,e.target.value)}
                                style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'5px 10px', fontSize:'.84rem', color:'var(--text-primary)', fontFamily:'var(--font-body)', outline:'none' }} />
                              {(q.options?.length??0)>2 && <button onClick={()=>removeQOpt(q.id,oi)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1rem', lineHeight:1 }}>×</button>}
                            </div>
                          ))}
                          {(q.options?.length??0)<8 && <button className="btn btn-xs btn-ghost" onClick={()=>addQOpt(q.id)} style={{ alignSelf:'flex-start', marginTop:'2px' }}>+ option</button>}
                        </div>
                      )}
                    </div>
                  ))}
                  <button className="btn btn-sm" onClick={()=>setSurveyQs(p=>[...p,newQ()])} style={{ alignSelf:'flex-start', borderStyle:'dashed' }}>+ Add question</button>
                </div>
              </div>
            )}

            {/* Cover image */}
            <div className="field">
              <label>Cover image <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
              {!displayPreview ? (
                <button type="button" onClick={()=>fileRef.current?.click()}
                  style={{ width:'100%', padding:'22px 16px', border:'2px dashed var(--border-md)', borderRadius:'var(--radius-md)', background:'var(--bg2)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', color:'var(--text-muted)', transition:'all .15s' }}
                  onMouseEnter={e=>{const el=e.currentTarget; el.style.borderColor=accent; el.style.color=accent; el.style.background='var(--surface2)'}}
                  onMouseLeave={e=>{const el=e.currentTarget; el.style.borderColor='var(--border-md)'; el.style.color='var(--text-muted)'; el.style.background='var(--bg2)'}}>
                  <span style={{ fontSize:'1.6rem' }}>🖼️</span>
                  <p style={{ fontWeight:600, fontSize:'.875rem' }}>Choose from your device</p>
                  <p style={{ fontSize:'.75rem' }}>Gallery · Camera roll · Files</p>
                </button>
              ) : (
                <div style={{ position:'relative' }}>
                  <img src={displayPreview} alt="" style={{ width:'100%', height:'160px', objectFit:'cover', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', display:'block', boxShadow:'var(--shadow-md)' }} />
                  {uploading && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,.75)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}><span className="spinner" /><p style={{ fontSize:'.8rem' }}>Uploading…</p></div>}
                  {!uploading && coverImage && <div style={{ position:'absolute', top:'8px', left:'8px', background:'var(--green)', color:'#fff', fontSize:'.72rem', fontWeight:700, padding:'3px 10px', borderRadius:'20px' }}>✓ Done</div>}
                  <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                    <button type="button" className="btn btn-sm" onClick={()=>fileRef.current?.click()}>Change</button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={()=>{setCoverImage(''); setPreviewUrl(''); if(fileRef.current)fileRef.current.value=''}}>Remove</button>
                  </div>
                </div>
              )}
              {uploadErr && <p className="error-text">{uploadErr}</p>}
            </div>
          </div>

          {/* ── Advanced settings accordion ── */}
          <div style={{ marginTop:'20px' }}>
            <div className="adv-toggle" onClick={()=>setAdvOpen(o=>!o)}>
              <span style={{ fontSize:'.9rem' }}>⚙</span>
              Advanced settings
              <span className={`adv-chevron${advOpen?' open':''}`}>▼</span>
              {(slug||pin||memberTheme!=='auto'||cats) && (
                <span style={{ marginLeft:'auto', fontSize:'.72rem', color:accent, fontWeight:600 }}>configured</span>
              )}
            </div>

            {advOpen && (
              <div className="adv-body">
                <div className="field">
                  <label>Custom link slug</label>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'.8rem', color:'var(--text-muted)', flexShrink:0, fontFamily:'monospace' }}>…/s/</span>
                    <input type="text" placeholder="my-topic" value={slug}
                      onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                      style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:'.875rem', color:'var(--text-primary)', fontFamily:'monospace', outline:'none' }} />
                  </div>
                  <span className="hint">Leave blank for an auto-generated link.</span>
                </div>

                <div className="field">
                  <label>Access PIN <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(4 digits)</span></label>
                  <input type="text" inputMode="numeric" maxLength={4} placeholder="e.g. 4821" value={pin}
                    onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                    style={{ width:'100px', background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', padding:'9px 14px', fontSize:'1.1rem', color:'var(--text-primary)', fontFamily:'monospace', outline:'none', letterSpacing:'.2em', textAlign:'center' }} />
                  <span className="hint">Members must enter this PIN before they can respond.</span>
                </div>

                {!isPoll && !isSurvey && !isCatchUp && (
                  <div className="field">
                    <label>Response categories</label>
                    <input type="text" placeholder="e.g. Design, Tech, Marketing" value={cats} onChange={e=>setCats(e.target.value)} />
                    <span className="hint">Comma-separated. Lets you filter by topic in the admin view.</span>
                  </div>
                )}

                <div className="field">
                  <label>Member page theme</label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {(['auto','light','dark'] as const).map(t=>(
                      <button key={t} type="button" onClick={()=>setMemberTheme(t)}
                        style={{ padding:'7px 16px', borderRadius:'var(--radius-sm)', border:`1.5px solid ${memberTheme===t?accent:'var(--border-md)'}`, background:memberTheme===t?`${accent}12`:'var(--surface2)', cursor:'pointer', fontSize:'.84rem', fontWeight:memberTheme===t?600:400, color:memberTheme===t?accent:'var(--text-secondary)', fontFamily:'var(--font-body)' }}>
                        {t==='auto'?'🖥 Auto':t==='light'?'☀️ Light':'🌙 Dark'}
                      </button>
                    ))}
                  </div>
                  <span className="hint">Override the theme for members, regardless of their device setting.</span>
                </div>
              </div>
            )}
          </div>

          {!user && (
            <div style={{ background:'var(--accent-soft)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginTop:'16px', fontSize:'.84rem', color:'var(--accent-text)', border:'1px solid rgba(79,70,229,.15)', lineHeight:1.6 }}>
              <Link to="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Sign in</Link> to save sessions to your dashboard and come back to them anytime.
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary btn-full" style={{ marginTop:'1.25rem', padding:'13px', fontSize:'.9375rem' }} onClick={create} disabled={loading||uploading}>
            {loading ? <><span className="spinner spinner-white" /> Creating…</> : `Create ${typeInfo?.label} session →`}
          </button>
        </div>
      </main>
      <Credit />
    </div>
  )
}
