// ===== CENTAVOS — Generic reactive localStorage hook =====

import { useState, useCallback } from 'react'
import { getItem, setItem } from '../utils/storage'

type Updater<T> = T | ((prev: T) => T)

/**
 * A reactive hook that reads from and writes to localStorage.
 * Re-renders the component whenever the value changes.
 * Supports both direct value and functional updater pattern (like useState).
 *
 * @param key          - localStorage key (e.g. 'fin:accounts')
 * @param defaultValue - Fallback if key is missing or JSON is malformed
 * @returns [value, setValue] — same interface as useState
 */
export function useStorage<T>(key: string, defaultValue: T): [T, (updater: Updater<T>) => void] {
  const [state, setState] = useState<T>(() => getItem<T>(key, defaultValue))

  const setValue = useCallback(
    (updater: Updater<T>) => {
      setState(prev => {
        const next = typeof updater === 'function'
          ? (updater as (prev: T) => T)(prev)
          : updater
        setItem(key, next)
        return next
      })
    },
    [key],
  )

  return [state, setValue]
}
