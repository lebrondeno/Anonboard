import { useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling_ref = useRef(false)

  useEffect(() => {
    const threshold = 72

    function onTouchStart(e: TouchEvent) {
      // Only trigger if at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        pulling_ref.current = true
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling_ref.current) return
      const diff = e.touches[0].clientY - startY.current
      if (diff > 20 && window.scrollY === 0) {
        setPulling(diff > threshold)
      }
    }

    async function onTouchEnd() {
      if (!pulling_ref.current) return
      pulling_ref.current = false

      if (pulling) {
        setPulling(false)
        setRefreshing(true)
        if ('vibrate' in navigator) navigator.vibrate([10, 50, 10])
        await onRefresh()
        setRefreshing(false)
      } else {
        setPulling(false)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [pulling, onRefresh])

  return { pulling, refreshing }
}
