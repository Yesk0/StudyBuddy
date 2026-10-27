import { getAuthToken, setAuthToken } from './token'

export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ErrorBody = { detail?: string | { msg: string }[] }

function readErrorMessage(body: ErrorBody | null, status: number): string {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) return detail[0].msg.replace(/^Value error, /, '')
  if (status >= 500) return 'Something went wrong on our side. Please try again.'
  return `Request failed with status ${status}`
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection.')
  }

  if (!response.ok) {
    if (response.status === 401 && token) setAuthToken(null)
    const body = (await response.json().catch(() => null)) as ErrorBody | null
    throw new ApiError(response.status, readErrorMessage(body, response.status))
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function putJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return error instanceof Error ? error.message : fallback
}
