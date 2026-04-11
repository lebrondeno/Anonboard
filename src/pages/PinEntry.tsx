import { useState } from 'react'
import ThemeToggle from '../components/ThemeToggle'

// Standalone PIN gate component used inside Submit and Survey
export function PinGate({ correctPin, onUnlock }: { correctPin: string; onUnlock: () => void }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  function handleDigit(i: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[i] = v
    setDigits(newDigits)
    setError(false)

    if (v && i < 3) {
      const next = document.getElementById(`pin-digit-${i + 1}`) as HTMLInputElement
      next?.focus()
    }

    if (newDigits.every(d => d !== '') && newDigits.join('').length === 4) {
      const entered = newDigits.join('')
      if (entered === correctPin) {
        onUnlock()
      } else {
        setError(true)
        setShaking(true)
        setDigits(['', '', '', ''])
        setTimeout(() => {
          setShaking(false)
          const first = document.getElementById('pin-digit-0') as HTMLInputElement
          first?.focus()
        }, 600)
      }
    }
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const prev = document.getElementById(`pin-digit-${i - 1}`) as HTMLInputElement
      prev?.focus()
      const newDigits = [...digits]
      newDigits[i - 1] = ''
      setDigits(newDigits)
    }
  }

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '2rem' }}>
        <ThemeToggle />
      </div>
      <div className="animate-in" style={{ width: '100%', maxWidth: '320px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '6px' }}>
          Protected session
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Enter the 4-digit PIN to continue
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '1rem', animation: shaking ? 'shake 0.5s both' : 'none' }}>
          <style>{`@keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-6px)} 40%,60%{transform:translateX(6px)} }`}</style>
          {digits.map((d, i) => (
            <input key={i} id={`pin-digit-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              autoFocus={i === 0}
              style={{ width:52, height:60, textAlign:'center', fontSize:'1.5rem', fontWeight:700, fontFamily:'var(--font-body)', background:'var(--bg2)', border:`2px solid ${error ? 'var(--red)' : d ? 'var(--accent)' : 'var(--border-md)'}`, borderRadius:'var(--radius-md)', color:'var(--text-primary)', outline:'none', boxShadow: d ? '0 0 0 3px var(--accent-soft)' : 'none', transition:'all 0.15s' }} />
          ))}
        </div>
        {error && <p style={{ fontSize: '0.84rem', color: 'var(--red-text)', marginTop: '8px' }}>Incorrect PIN. Try again.</p>}
      </div>
    </div>
  )
}
