import { useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

// Determines if we're going "deeper" (forward) or "back"
// based on pathname depth
function getDepth(path: string): number {
  return path.split('/').filter(Boolean).length
}

interface Props { children: React.ReactNode }

export default function PageTransition({ children }: Props) {
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    const prev = prevPath.current
    const curr = location.pathname

    if (prev === curr) return

    const prevDepth = getDepth(prev)
    const currDepth = getDepth(curr)

    // Going deeper = slide left, going back = slide right
    if (currDepth > prevDepth) {
      setAnimClass('page-slide-in-right')
    } else if (currDepth < prevDepth) {
      setAnimClass('page-slide-in-left')
    } else {
      setAnimClass('page-fade-in')
    }

    prevPath.current = curr

    // Clear class after animation
    const t = setTimeout(() => setAnimClass(''), 350)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <div
      key={location.pathname}
      className={animClass}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  )
}
