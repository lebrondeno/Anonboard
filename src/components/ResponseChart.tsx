import { useMemo } from 'react'

interface Props {
  dates: string[]   // ISO date strings of responses
  height?: number
}

export default function ResponseChart({ dates, height = 80 }: Props) {
  const data = useMemo(() => {
    if (dates.length === 0) return []

    // Build last 14 days buckets
    const days: Record<string, number> = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days[key] = 0
    }
    dates.forEach(d => {
      const key = d.slice(0, 10)
      if (key in days) days[key]++
    })

    return Object.entries(days).map(([date, count]) => ({
      date,
      count,
      label: new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }))
  }, [dates])

  const max = Math.max(...data.map(d => d.count), 1)

  if (dates.length === 0) return null

  return (
    <div style={{ width: '100%' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '10px' }}>
        Responses over 14 days
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height, width: '100%' }}>
        {data.map((d, i) => {
          const pct = d.count / max
          const barH = Math.max(pct * height * 0.9, d.count > 0 ? 4 : 1)
          const isToday = i === data.length - 1
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }} title={`${d.label}: ${d.count} response${d.count !== 1 ? 's' : ''}`}>
              <div style={{
                width: '100%',
                height: barH,
                background: isToday ? 'var(--accent)' : d.count > 0 ? 'var(--accent-soft)' : 'var(--border)',
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.4s ease',
                border: isToday ? 'none' : d.count > 0 ? '1px solid rgba(79,70,229,.25)' : 'none',
                position: 'relative',
              }}>
                {d.count > 0 && (
                  <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: isToday ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {d.count}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* X axis labels — show only first, middle, last */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{data[0]?.label}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{data[6]?.label}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600 }}>Today</span>
      </div>
    </div>
  )
}
