const STORAGE_PREFIX = 'gzf-'

export const storage = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key)
      if (stored) {
        return JSON.parse(stored) as T
      }
    } catch (e) {
      console.error(`Failed to get ${key} from storage:`, e)
    }
    return defaultValue ?? null
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.error(`Failed to set ${key} to storage:`, e)
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (e) {
      console.error(`Failed to remove ${key} from storage:`, e)
    }
  },

  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.error('Failed to clear storage:', e)
    }
  }
}