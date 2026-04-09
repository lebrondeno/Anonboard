import * as XLSX from 'xlsx'
import type { Session, Response, ChatMessage, SurveyQuestion } from './supabase'

function autoWidth(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })
  const colWidths: number[] = []
  data.forEach(row => row.forEach((cell, i) => {
    const len = String(cell ?? '').length
    colWidths[i] = Math.min(60, Math.max(colWidths[i] ?? 10, len + 2))
  }))
  ws['!cols'] = colWidths.map(w => ({ wch: w }))
}

export function exportSession(
  session: Session,
  responses: Response[],
  messages: ChatMessage[]
) {
  const wb = XLSX.utils.book_new()
  const type = session.type

  // ── Sheet 1: Summary ──
  const summaryData = [
    ['Whispr Session Export'],
    [],
    ['Session Title', session.title],
    ['Type', session.type],
    ['Description', session.description || '—'],
    ['Created', new Date(session.created_at).toLocaleString()],
    ['Total Responses', type === 'catchup' ? messages.length : responses.length],
    [],
    ['Exported on', new Date().toLocaleString()],
    ['Made by lebrondeno'],
  ]
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

  // ── Per-type sheets ──
  if (type === 'poll') {
    // Poll results sheet
    const total = responses.length
    const tallies: Record<string, number> = {}
    session.poll_options.forEach(o => { tallies[o] = 0 })
    responses.forEach(r => { if (r.poll_choice) tallies[r.poll_choice] = (tallies[r.poll_choice] ?? 0) + 1 })

    const rows = [
      ['Option', 'Votes', 'Percentage'],
      ...session.poll_options.map(o => [
        o,
        tallies[o] ?? 0,
        total > 0 ? `${Math.round(((tallies[o] ?? 0) / total) * 100)}%` : '0%'
      ]),
      [],
      ['Total votes', total],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    autoWidth(ws)
    XLSX.utils.book_append_sheet(wb, ws, 'Poll Results')

  } else if (type === 'catchup') {
    // Chat transcript
    const rows = [
      ['#', 'Anonymous Name', 'Message', 'Reactions', 'Pinned', 'Timestamp'],
      ...messages.map((m, i) => [
        i + 1,
        m.anon_name,
        m.text.startsWith('IMG_STICKER:') ? '[Image Sticker]' : m.text,
        Object.entries(m.reactions ?? {}).filter(([,v]) => v > 0).map(([e, v]) => `${e}${v}`).join(' ') || '—',
        m.is_pinned ? 'Yes' : 'No',
        new Date(m.created_at).toLocaleString(),
      ])
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    autoWidth(ws)
    XLSX.utils.book_append_sheet(wb, ws, 'Chat Transcript')

  } else if (type === 'survey') {
    const questions: SurveyQuestion[] = session.survey_questions ?? []

    // Sheet per question for choice/rating + one master sheet
    const masterHeaders = ['#', 'Submitted At', ...questions.map(q => q.text)]
    const masterRows = responses.map((r, i) => [
      i + 1,
      new Date(r.created_at).toLocaleString(),
      ...questions.map(q => r.survey_answers?.[q.id] ?? '—')
    ])
    const masterWs = XLSX.utils.aoa_to_sheet([masterHeaders, ...masterRows])
    autoWidth(masterWs)
    XLSX.utils.book_append_sheet(wb, masterWs, 'All Responses')

    // Per-question breakdown for choice/rating questions
    questions.forEach(q => {
      if (q.type === 'choice' && q.options) {
        const tallies: Record<string, number> = {}
        q.options.forEach(o => { tallies[o] = 0 })
        responses.forEach(r => {
          const ans = r.survey_answers?.[q.id]
          if (ans) tallies[ans] = (tallies[ans] ?? 0) + 1
        })
        const total = responses.length
        const rows = [
          [q.text],
          [],
          ['Option', 'Count', 'Percentage'],
          ...q.options.map(o => [o, tallies[o] ?? 0, total > 0 ? `${Math.round(((tallies[o] ?? 0) / total) * 100)}%` : '0%']),
        ]
        const ws = XLSX.utils.aoa_to_sheet(rows)
        autoWidth(ws)
        const sheetName = q.text.slice(0, 28).replace(/[:\\/?*\[\]]/g, '')
        XLSX.utils.book_append_sheet(wb, ws, sheetName)

      } else if (q.type === 'rating') {
        const answers = responses.map(r => Number(r.survey_answers?.[q.id])).filter(n => !isNaN(n) && n > 0)
        const avg = answers.length > 0 ? (answers.reduce((a, b) => a + b, 0) / answers.length).toFixed(2) : '—'
        const dist: Record<number, number> = {}
        answers.forEach(n => { dist[n] = (dist[n] ?? 0) + 1 })
        const rows = [
          [q.text],
          [],
          ['Average rating', avg],
          ['Total responses', answers.length],
          [],
          ['Rating', 'Count'],
          ...[1,2,3,4,5].map(n => [n, dist[n] ?? 0])
        ]
        const ws = XLSX.utils.aoa_to_sheet(rows)
        autoWidth(ws)
        const sheetName = ('Rating: ' + q.text).slice(0, 28).replace(/[:\\/?*\[\]]/g, '')
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }
    })

  } else {
    // Ideas / Suggestions / Discussion / AMA / Feedback
    const rows = [
      ['#', 'Response', 'Category', 'Reactions', 'Submitted At'],
      ...responses.map((r, i) => [
        i + 1,
        r.text,
        r.category || '—',
        Object.entries(r.reactions ?? {}).filter(([,v]) => (v as number) > 0).map(([e, v]) => `${e}${v}`).join(' ') || '—',
        new Date(r.created_at).toLocaleString(),
      ])
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    autoWidth(ws)
    XLSX.utils.book_append_sheet(wb, ws, 'Responses')
  }

  // Download
  const filename = `whispr_${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.xlsx`
  XLSX.writeFile(wb, filename)
}
