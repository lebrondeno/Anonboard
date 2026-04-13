import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0}
        />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'My Sessions',
    path: '/dashboard',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
        />
        <rect x="14" y="3" width="7" height="7" rx="1.5"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
        />
        <rect x="3" y="14" width="7" height="7" rx="1.5"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
        />
        <rect x="14" y="14" width="7" height="7" rx="1.5"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
        />
      </svg>
    ),
  },
]

// Pages where bottom nav should NOT appear
const HIDDEN_ON = ['/s/', '/chat/', '/survey/', '/admin/', '/login']

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()

  // Hide on member-facing pages, login, and admin
  const shouldHide = HIDDEN_ON.some(p => location.pathname.startsWith(p))
  if (shouldHide) return null

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/create')
    return location.pathname.startsWith(path)
  }

  function handleTap() {
    // Haptic feedback on nav tap
    if ('vibrate' in navigator) navigator.vibrate(8)
  }

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div style={{ height: 64 }} />

      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        height: 60,
      }}>
        {/* Frosted glass background */}
        <div style={{
          position: 'absolute', inset: 0,
          borderTop: '1px solid var(--border)',
        }} />
        <style>{`
          [data-theme="light"] nav.bottom-nav-bg { background: rgba(250,250,247,0.92); }
          [data-theme="dark"]  nav.bottom-nav-bg { background: rgba(12,12,20,0.92); }
        `}</style>
        <div className="bottom-nav-bg" style={{ position:'absolute', inset:0, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }} />

        {NAV_ITEMS.map(item => {
          // Hide Sessions if not logged in
          if (item.id === 'dashboard' && !user) return null
          const active = isActive(item.path)

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={handleTap}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
                flex: 1,
                padding: '4px 0',
                position: 'relative',
                zIndex: 1,
                transition: 'color 0.15s',
                minHeight: 48,
                justifyContent: 'center',
              }}
            >
              {item.icon(active)}
              <span style={{ fontSize: '.65rem', fontWeight: active ? 700 : 500, letterSpacing: '.02em', fontFamily: 'var(--font-body)' }}>{item.label}</span>
              {/* Active dot indicator */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 4,
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'fadeUp .2s ease',
                }} />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
