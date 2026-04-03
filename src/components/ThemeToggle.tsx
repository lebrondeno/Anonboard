import { useTheme } from '../lib/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        border: '1px solid var(--border-md)',
        background: theme === 'dark' ? 'var(--accent)' : 'var(--surface2)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.25s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {/* Track icons */}
      <span style={{
        position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)',
        fontSize: '10px', lineHeight: 1, opacity: theme === 'dark' ? 1 : 0,
        transition: 'opacity 0.2s', pointerEvents: 'none',
      }}>🌙</span>
      <span style={{
        position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
        fontSize: '10px', lineHeight: 1, opacity: theme === 'light' ? 1 : 0,
        transition: 'opacity 0.2s', pointerEvents: 'none',
      }}>☀️</span>
      {/* Thumb */}
      <span style={{
        position: 'absolute',
        top: 2,
        left: theme === 'dark' ? 18 : 2,
        width: 16, height: 16,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}
