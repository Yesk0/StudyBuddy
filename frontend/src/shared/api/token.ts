const STORAGE_KEY = 'studybuddy.token'

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let token = readStoredToken()
const listeners = new Set<() => void>()

export function getAuthToken(): string | null {
  return token
}

export function setAuthToken(next: string | null): void {
  if (next === token) return
  token = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable (private mode); the in-memory token still works.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeToAuthToken(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
