import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, SESSION_TYPES } from '../lib/supabase'
import type { SessionType } from '../lib/supabase'
import Credit from '../components/Credit'

export default function Home() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<SessionType>('ideas')
  const [cats, setCats] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createSession() {
    if (!title.trim()) { setError('Please enter a title for your session.'); return }
    setLoading(true); setError('')

    const categories = cats.trim()
      ? cats.split(',').map(c => c.trim()).filter(Boolean)
      : ['General']

    const adminToken = crypto.randomUUID()
    const { data, error: err } = await supabase
      .from('sessions')
      .insert({ title: title.trim(), description: description.trim(), type, categories, admin_token: adminToken, allow_reactions: true, allow_replies: false })
      .select().single()

    if (err || !data) { setError('Failed to create session. Check Supabase connection.'); setLoading(false); return }
    localStorage.setItem(`admin_${data.id}`, adminToken)
    navigate(`/admin/${data.id}`)
  }

  return (
    <div className="page">
      <div style={{ marginBottom: '2rem' }} className="animate-in">
        <p className="wordmark">Whi<span>spr</span></p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Anonymous responses for any topic — ideas, questions, feedback, discussions.
        </p>
      </div>

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

      <div className="card animate-in-d2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field">
            <label>Title / Question</label>
            <input type="text" placeholder={`e.g. ${type === 'ama' ? 'Ask me anything about startups' : type === 'discussion' ? 'What should we improve about our product?' : type === 'poll' ? 'Best day for our team meetup?' : 'Ideas for our next community event'}`} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createSession()} />
          </div>
          <div className="field">
            <label>Description <span style={{ fontWeight: 300, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input type="text" placeholder="Give your group more context..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label>Categories <span style={{ fontWeight: 300, color: 'var(--text-muted)' }}>(comma-separated, optional)</span></label>
            <input type="text" placeholder="e.g. Design, Tech, Marketing" value={cats} onChange={e => setCats(e.target.value)} />
            <span className="hint">Helps you filter responses later. Leave blank for a single open category.</span>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={createSession} disabled={loading}>
          {loading ? <><span className="spinner spinner-white" /> Creating...</> : `Create ${SESSION_TYPES[type].label} session →`}
        </button>
      </div>

      <div className="card animate-in-d3" style={{ marginTop: '12px' }}>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          <strong style={{ fontWeight: 500, color: 'var(--text-primary)' }}>No accounts for your group.</strong>{' '}
          Members open your link, type their response, and submit — no name, no number, nothing tracked. Works on any device.
        </p>
      </div>

      <Credit />
    </div>
  )
}
