import { useEffect } from 'react'

// Calls `handler` when a click/tap happens outside `ref`.
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler, active])
}
