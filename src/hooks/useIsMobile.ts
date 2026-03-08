import { useState, useEffect } from 'react'

/**
 * Returns true when the viewport width is below the given breakpoint.
 * Reacts to window resize in real time using matchMedia.
 *
 * @param breakpoint - Pixel width threshold (default 768 = mobile-first md breakpoint)
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
