import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'studybuddy.theme'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** The explicit choice, or the system preference when the user never chose. */
export function currentTheme(): Theme {
  return storedTheme() ?? (darkQuery().matches ? 'dark' : 'light')
}

export function applyTheme(): void {
  document.documentElement.dataset.theme = currentTheme()
}

function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Without storage the choice still applies for this visit.
  }
  document.documentElement.dataset.theme = theme
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const query = darkQuery()
  const onSystemChange = () => {
    if (!storedTheme()) {
      applyTheme()
      listener()
    }
  }
  query.addEventListener('change', onSystemChange)
  return () => {
    listeners.delete(listener)
    query.removeEventListener('change', onSystemChange)
  }
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, currentTheme)
  const toggle = useCallback(() => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'), [])
  return [theme, toggle]
}
