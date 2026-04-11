import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Props { responseId: string }

export default function AdminNote({ responseId }: Props) {
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    supabase.from('admin_notes').select('note').eq('response_id', responseId).single()
      .then(({ data }) => { if (data) { setNote(data.note); setSaved(data.note) } })
  }, [open, responseId])

  async function save() {
    setSaving(true)
    await supabase.from('admin_notes').upsert({ response_id: responseId, note: note.trim() }, { onConflict: 'response_id' })
    setSaved(note.trim())
    setSaving(false)
    if (!note.trim()) setOpen(false)
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem', color: saved ? 'var(--amber-text)' : 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        📝 {saved ? 'Edit note' : 'Add note'}
        {saved && <span style={{ background: 'var(--amber-soft)', border: '1px solid rgba(217,119,6,.2)', borderRadius: '20px', padding: '1px 7px', fontSize: '0.68rem', color: 'var(--amber-text)' }}>has note</span>}
      </button>

      {open && (
        <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--amber-soft)', border: '1px solid rgba(217,119,6,.2)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--amber-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Private note — only you see this</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Follow up on this, Already actioned..."
            rows={2}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid rgba(217,119,6,.25)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '0.84rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = 'var(--amber)'}
            onBlur={e => e.target.style.borderColor = 'rgba(217,119,6,.25)'}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button onClick={save} disabled={saving}
              style={{ background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 'var(--radius-xs)', padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {saving ? 'Saving…' : 'Save note'}
            </button>
            {saved && (
              <button onClick={() => { setNote(''); save() }}
                style={{ background: 'none', border: '1px solid rgba(217,119,6,.3)', borderRadius: 'var(--radius-xs)', padding: '5px 14px', fontSize: '0.8rem', color: 'var(--amber-text)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Clear
              </button>
            )}
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
