import { useTheme } from '../lib/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 40, height: 22, borderRadius: 11,
        border: '1px solid var(--border-md)',
        background: dark ? 'var(--accent)' : 'var(--surface2)',
        cursor: 'pointer', position: 'relative', flexShrink: 0, padding: 0,
        boxShadow: dark ? 'var(--shadow-accent)' : 'var(--shadow-sm)',
        transition: 'background 0.25s, box-shadow 0.25s',
      }}
    >
      <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: '9px', opacity: dark ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}>🌙</span>
      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: '9px', opacity: dark ? 0 : 1, transition: 'opacity 0.2s', pointerEvents: 'none' }}>☀️</span>
      <span style={{
        position: 'absolute', top: 2,
        left: dark ? 20 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: dark ? '#fff' : 'var(--accent)',
        transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}
