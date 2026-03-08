// ===== CENTAVOS — localStorage Helpers =====

/**
 * Read a value from localStorage, returning `defaultValue` if the key
 * is missing or the stored JSON is malformed.
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

/**
 * Persist a value to localStorage as JSON.
 * Silently ignores write errors (e.g., private browsing quota exceeded).
 */
export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage quota exceeded or not available — fail silently
  }
}

/**
 * Remove a single key from localStorage.
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // fail silently
  }
}

/**
 * Export all `fin:*` keys as a plain object (for JSON download).
 */
export function exportAllData(): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('fin:')) {
        const raw = localStorage.getItem(key)
        if (raw) result[key] = JSON.parse(raw)
      }
    }
  } catch {
    // return whatever was collected
  }
  return result
}

/**
 * Import data from an exported JSON object back into localStorage.
 * Merges (overwrites) only the keys present in the import.
 */
export function importAllData(data: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('fin:')) {
      setItem(key, value)
    }
  }
}
