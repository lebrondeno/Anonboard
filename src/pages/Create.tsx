import { useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase, SESSION_TYPES, FRAMING_MODES, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { SessionType, SurveyQuestion, QuestionType, FramingMode } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import Credit from '../components/Credit'
import { SESSION_ICONS, TYPE_ACCENT } from '../components/SessionIcon'
import { haptics } from '../lib/haptics'

const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value:'short',  label:'Short answer'     },
  { value:'long',   label:'Long answer'       },
  { value:'choice', label:'Multiple choice'   },
  { value:'rating', label:'Star rating (1–5)' },
  { value:'yesno',  label:'Yes / No'          },
]
function newQ(): SurveyQuestion {
  return { id:crypto.randomUUID(), text:'', type:'short', options:['',''], required:true }
}

export default function Create() {
  const { type = 'openfloor' } = useParams<{ type: string }>()
  const sessionType = (Object.keys(SESSION_TYPES).includes(type) ? type : 'openfloor') as SessionType
  const typeInfo = SESSION_TYPES[sessionType]
  const accent = TYPE_ACCENT[sessionType]

  const navigate = useNavigate()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  // Wizard step — 3 steps
  const [step, setStep] = useState(1)

  // Step 1 — Core
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [framingMode, setFramingMode] = useState<FramingMode>('ideas')

  // Step 2 — Type-specific content
  const [pollOptions, setPollOptions] = useState(['',''])
  const [surveyQs, setSurveyQs] = useState<SurveyQuestion[]>([newQ()])
  const [coverImage, setCoverImage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  // Step 3 — Advanced settings
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

  // Total steps — simpler types skip step 2 content (just cover image)
  const totalSteps = 3

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setPreviewUrl(URL.createObjectURL(file)); setCoverImage(''); setUploadErr(''); setUploading(true)
    const fn = `cover_${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('covers').upload(fn, file, { upsert:true })
    if (upErr) { setUploadErr('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('covers').getPublicUrl(fn)
    setCoverImage(data.publicUrl); setUploading(false)
  }

  function updateQ(id: string, patch: Partial<SurveyQuestion>) {
    setSurveyQs(p => p.map(q => q.id===id ? {...q,...patch} : q))
  }
  function updateQOpt(qid: string, oi: number, val: string) {
    setSurveyQs(p => p.map(q => q.id===qid ? {...q, options:q.options?.map((o,i)=>i===oi?val:o)} : q))
  }
  function addQOpt(qid: string) {
    setSurveyQs(p => p.map(q => q.id===qid && (q.options?.length??0)<8 ? {...q, options:[...(q.options??[]),'']} : q))
  }
  function removeQOpt(qid: string, oi: number) {
    setSurveyQs(p => p.map(q => q.id===qid && (q.options?.length??0)>2 ? {...q, options:q.options?.filter((_,i)=>i!==oi)} : q))
  }
  function moveQ(id: string, dir: -1|1) {
    const idx = surveyQs.findIndex(q=>q.id===id), ni = idx+dir
    if (ni<0||ni>=surveyQs.length) return
    const a=[...surveyQs]; [a[idx],a[ni]]=[a[ni],a[idx]]; setSurveyQs(a)
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      if (!title.trim()) { setError('Give your session a title.'); haptics.error(); return }
    }
    if (step === 2) {
      if (isPoll && pollOptions.filter(o=>o.trim()).length < 2) { setError('Add at least 2 options.'); haptics.error(); return }
      if (isSurvey && surveyQs.find(q=>!q.text.trim())) { setError('Every question needs text.'); haptics.error(); return }
      if (uploading) { setError('Image still uploading — hold on.'); return }
    }
    haptics.tap()
    setStep(s => Math.min(s + 1, totalSteps))
  }

  function prevStep() {
    haptics.tap()
    setStep(s => Math.max(s - 1, 1))
  }

  async function create() {
    if (slug.trim() && !/^[a-z0-9-]+$/.test(slug.trim())) { setError('Slug: lowercase letters, numbers, hyphens only.'); haptics.error(); return }
    if (pin.trim() && !/^\d{4}$/.test(pin.trim())) { setError('PIN must be exactly 4 digits.'); haptics.error(); return }
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

    if (err || !data) {
      setError("Couldn't create the session. " + err?.message)
      setLoading(false); haptics.error(); return
    }
    localStorage.setItem(`admin_${data.id}`, adminToken)
    haptics.success()
    navigate(`/admin/${data.id}`)
  }

  const displayPreview = previewUrl || coverImage
  const Icon = SESSION_ICONS[sessionType]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', position:'relative', zIndex:1 }}>
      {/* Topbar */}
      <header className="topbar">
        <button onClick={step > 1 ? prevStep : () => navigate('/')}
          style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:'.875rem', fontWeight:500, padding:'4px 0' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {step > 1 ? 'Back' : 'Sessions'}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'.78rem', color:'var(--text-muted)', fontWeight:500 }}>Step {step} of {totalSteps}</span>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth:'560px', margin:'0 auto', padding:'1.5rem var(--page-pad) 120px' }}>

        {/* Progress bar */}
        <div className="wizard-progress animate-in" style={{ marginBottom:'1.5rem' }}>
          {Array.from({length: totalSteps}).map((_,i) => (
            <div key={i} className={`wizard-step${i < step ? ' done' : i === step - 1 ? ' active' : ''}`} />
          ))}
        </div>

        {/* ── STEP 1: Core details ── */}
        {step === 1 && (
          <div className="animate-in" key="step1">
            {/* Type badge */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'1.5rem' }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${accent}15`, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${accent}25`, flexShrink:0 }}>
                <Icon size={24} color={accent} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, letterSpacing:'-.03em', color:'var(--text-primary)', fontStyle:'italic', lineHeight:1.1 }}>
                  {isSurvey ? 'Build a survey' : isCatchUp ? 'Start a chat room' : isOpenFloor ? "What's the topic?" : isPoll ? 'Set up a poll' : 'Collect feedback'}
                </p>
                <p style={{ fontSize:'.84rem', color:'var(--text-muted)', marginTop:'3px' }}>{typeInfo?.desc}</p>
              </div>
            </div>

            {!isConfigured && (
              <div style={{ background:'var(--amber-soft)', border:'1px solid rgba(217,119,6,.25)', borderRadius:'var(--radius-md)', padding:'10px 14px', marginBottom:'14px', fontSize:'.84rem', color:'var(--amber-text)' }}>
                ⚠️ Set up Supabase credentials in <code>.env</code> first.
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              {/* Framing mode for Open Floor */}
              {isOpenFloor && (
                <div>
                  <p style={{ fontSize:'.74rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'10px' }}>What kind of session?</p>
                  <div className="framing-grid">
                    {(Object.entries(FRAMING_MODES) as [FramingMode, typeof FRAMING_MODES[string]][]).map(([key, fm]) => (
                      <div key={key} className={`framing-card tap-feedback${framingMode===key?' selected':''}`}
                        onClick={() => { setFramingMode(key); haptics.tap() }}>
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
                <input type="text"
                  placeholder={
                    isOpenFloor ? FRAMING_MODES[framingMode]?.placeholder :
                    isCatchUp   ? "e.g. Friday Night Hangout 🎉" :
                    isPoll      ? "e.g. What should we work on next?" :
                    isSurvey    ? "e.g. Q2 Product Feedback" :
                    "e.g. How are we doing?"
                  }
                  value={title} onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && nextStep()}
                  autoFocus
                />
              </div>

              <div className="field">
                <label>Description <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                <textarea placeholder="A bit more context for your group..." value={description}
                  onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Type-specific content + cover image ── */}
        {step === 2 && (
          <div className="animate-in" key="step2">
            <p style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:700, letterSpacing:'-.03em', color:'var(--text-primary)', fontStyle:'italic', marginBottom:'1.25rem' }}>
              {isPoll ? 'Add your options' : isSurvey ? 'Build your questions' : 'Add a cover image'}
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              {/* Poll options */}
              {isPoll && (
                <div className="field">
                  <label>Poll Options</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {pollOptions.map((opt,i) => (
                      <div key={i} style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', border:'2px solid var(--border-lg)', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--text-muted)' }} />
                        </div>
                        <input type="text" placeholder={`Option ${i+1}`} value={opt}
                          onChange={e => setPollOptions(p=>p.map((o,idx)=>idx===i?e.target.value:o))}
                          style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-sm)', padding:'10px 12px', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
                        {pollOptions.length>2 && <button onClick={()=>{setPollOptions(p=>p.filter((_,idx)=>idx!==i)); haptics.tap()}} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.3rem', lineHeight:1, padding:'4px' }}>×</button>}
                      </div>
                    ))}
                    {pollOptions.length<8 && (
                      <button className="btn btn-sm btn-ghost tap-feedback" onClick={()=>{setPollOptions(p=>[...p,'']); haptics.tap()}} style={{ alignSelf:'flex-start' }}>+ Add option</button>
                    )}
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
                            <button className="btn btn-xs btn-danger" onClick={()=>{if(surveyQs.length>1){setSurveyQs(p=>p.filter(x=>x.id!==q.id)); haptics.tap()}}}>×</button>
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
                    <button className="btn btn-sm tap-feedback" onClick={()=>{setSurveyQs(p=>[...p,newQ()]); haptics.tap()}} style={{ alignSelf:'flex-start', borderStyle:'dashed' }}>+ Add question</button>
                  </div>
                </div>
              )}

              {/* Cover image — all types */}
              <div className="field">
                <label>Cover image <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
                {!displayPreview ? (
                  <button type="button" onClick={()=>fileRef.current?.click()}
                    style={{ width:'100%', padding:'28px 16px', border:'2px dashed var(--border-md)', borderRadius:'var(--radius-lg)', background:'var(--bg2)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', color:'var(--text-muted)', transition:'all .15s' }}
                    onMouseEnter={e=>{const el=e.currentTarget; el.style.borderColor=accent; el.style.color=accent; el.style.background='var(--surface2)'}}
                    onMouseLeave={e=>{const el=e.currentTarget; el.style.borderColor='var(--border-md)'; el.style.color='var(--text-muted)'; el.style.background='var(--bg2)'}}>
                    <span style={{ fontSize:'2rem' }}>🖼️</span>
                    <p style={{ fontWeight:600, fontSize:'.9rem' }}>Tap to add a cover photo</p>
                    <p style={{ fontSize:'.78rem' }}>From your gallery, camera roll or files</p>
                  </button>
                ) : (
                  <div style={{ position:'relative' }}>
                    <img src={displayPreview} alt="" style={{ width:'100%', height:'180px', objectFit:'cover', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', display:'block', boxShadow:'var(--shadow-md)' }} />
                    {uploading && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', color:'#fff' }}><span className="spinner spinner-white" /><p style={{ fontSize:'.85rem' }}>Uploading…</p></div>}
                    {!uploading && coverImage && <div style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(5,150,105,.9)', color:'#fff', fontSize:'.72rem', fontWeight:700, padding:'4px 12px', borderRadius:'20px' }}>✓ Done</div>}
                    <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                      <button type="button" className="btn btn-sm tap-feedback" onClick={()=>{fileRef.current?.click(); haptics.tap()}}>Change</button>
                      <button type="button" className="btn btn-sm btn-danger tap-feedback" onClick={()=>{setCoverImage(''); setPreviewUrl(''); if(fileRef.current)fileRef.current.value=''; haptics.tap()}}>Remove</button>
                    </div>
                  </div>
                )}
                {uploadErr && <p className="error-text">{uploadErr}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Advanced settings + launch ── */}
        {step === 3 && (
          <div className="animate-in" key="step3">
            <p style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:700, letterSpacing:'-.03em', color:'var(--text-primary)', fontStyle:'italic', marginBottom:'4px' }}>
              Almost there.
            </p>
            <p style={{ fontSize:'.875rem', color:'var(--text-muted)', marginBottom:'1.5rem', lineHeight:1.6 }}>
              These are optional. Most sessions go live without touching any of this.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div className="field">
                <label>Custom link <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontSize:'.78rem', color:'var(--text-muted)', flexShrink:0, fontFamily:'monospace', background:'var(--bg3)', padding:'10px 10px', borderRadius:'var(--radius-sm) 0 0 var(--radius-sm)', border:'1px solid var(--border-md)', borderRight:'none' }}>/s/</span>
                  <input type="text" placeholder="my-topic" value={slug}
                    onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                    style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border-md)', borderRadius:'0 var(--radius-sm) var(--radius-sm) 0', padding:'10px 12px', fontSize:'.875rem', color:'var(--text-primary)', fontFamily:'monospace', outline:'none' }} />
                </div>
                <span className="hint">Leave blank for an auto-generated link.</span>
              </div>

              <div className="field">
                <label>PIN protection <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {[0,1,2,3].map(i => (
                    <input key={i} id={`pin-create-${i}`} type="text" inputMode="numeric" maxLength={1}
                      value={pin[i] ?? ''}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g,'').slice(-1)
                        const arr = (pin+'    ').split('')
                        arr[i] = v
                        setPin(arr.slice(0,4).join('').trimEnd())
                        if (v && i < 3) {
                          const next = document.getElementById(`pin-create-${i+1}`) as HTMLInputElement
                          next?.focus()
                        }
                      }}
                      style={{ width:52, height:56, textAlign:'center', fontSize:'1.3rem', fontWeight:700, fontFamily:'var(--font-body)', background:'var(--bg2)', border:'1px solid var(--border-md)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', outline:'none', letterSpacing:'.1em', transition:'border-color .15s', boxShadow: pin[i] ? '0 0 0 2px var(--accent-soft)' : 'none' }}
                      onFocus={e => e.target.style.borderColor = accent}
                      onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                    />
                  ))}
                  {pin && <button className="btn btn-xs btn-ghost" onClick={()=>setPin('')} style={{ alignSelf:'center' }}>Clear</button>}
                </div>
                <span className="hint">Members must enter this before responding.</span>
              </div>

              {!isPoll && !isSurvey && !isCatchUp && (
                <div className="field">
                  <label>Categories <span style={{ fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                  <input type="text" placeholder="e.g. Design, Tech, Marketing" value={cats} onChange={e=>setCats(e.target.value)} />
                  <span className="hint">Comma-separated. Filter responses by topic in admin.</span>
                </div>
              )}

              <div className="field">
                <label>Member theme</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {(['auto','light','dark'] as const).map(t => (
                    <button key={t} type="button" className="tap-feedback" onClick={()=>{setMemberTheme(t); haptics.tap()}}
                      style={{ flex:1, padding:'10px 8px', borderRadius:'var(--radius-md)', border:`1.5px solid ${memberTheme===t?accent:'var(--border-md)'}`, background:memberTheme===t?`${accent}12`:'var(--surface2)', cursor:'pointer', fontSize:'.82rem', fontWeight:memberTheme===t?700:400, color:memberTheme===t?accent:'var(--text-secondary)', fontFamily:'var(--font-body)', transition:'all .15s' }}>
                      {t==='auto'?'🖥️ Auto':t==='light'?'☀️ Light':'🌙 Dark'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div style={{ marginTop:'1.5rem', background:`${accent}08`, border:`1px solid ${accent}20`, borderRadius:'var(--radius-lg)', padding:'1rem 1.25rem' }}>
              <p style={{ fontSize:'.72rem', fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Ready to go live</p>
              <p style={{ fontWeight:600, fontSize:'1rem', color:'var(--text-primary)', marginBottom:'3px', letterSpacing:'-.01em' }}>{title}</p>
              {description && <p style={{ fontSize:'.84rem', color:'var(--text-secondary)', marginBottom:'6px' }}>{description}</p>}
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{typeInfo?.label}</span>
                {isOpenFloor && <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>· {framingMode}</span>}
                {isPoll && <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>· {pollOptions.filter(o=>o.trim()).length} options</span>}
                {isSurvey && <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>· {surveyQs.length} question{surveyQs.length!==1?'s':''}</span>}
                {coverImage && <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>· has cover image</span>}
                {pin && <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>· PIN protected</span>}
                {slug && <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>· /s/{slug}</span>}
              </div>
            </div>

            {!user && (
              <div style={{ background:'var(--accent-soft)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginTop:'14px', fontSize:'.84rem', color:'var(--accent-text)', border:'1px solid rgba(79,70,229,.15)', lineHeight:1.6 }}>
                <Link to="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Sign in</Link> to track this session from your dashboard.
              </div>
            )}
          </div>
        )}

        {error && <p className="error-text" style={{ marginTop:'12px' }}>{error}</p>}
      </main>

      {/* ── Fixed bottom action bar ── */}
      <div style={{
        position:'fixed', bottom:'64px', left:0, right:0,
        padding:'12px var(--page-pad)',
        paddingBottom:'12px',
        zIndex:110,
        borderTop:'1px solid var(--border)',
      }}>
        <div style={{ position:'absolute', inset:0, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }} />
        <div style={{ position:'absolute', inset:0 }} className="bottom-nav-bg" />
        <div style={{ position:'relative', maxWidth:'560px', margin:'0 auto', display:'flex', gap:'10px' }}>
          {step < totalSteps ? (
            <button className="btn btn-primary btn-full tap-feedback" style={{ padding:'14px', fontSize:'.9375rem', fontWeight:700 }} onClick={nextStep}>
              Continue →
            </button>
          ) : (
            <button className="btn btn-primary btn-full tap-feedback" style={{ padding:'14px', fontSize:'.9375rem', fontWeight:700 }} onClick={create} disabled={loading}>
              {loading ? <><span className="spinner spinner-white" /> Creating…</> : 'Go live →'}
            </button>
          )}
        </div>
      </div>

      <Credit />
    </div>
  )
}
