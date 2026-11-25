import { describe, expect, it } from 'vitest'
import { mockFetch } from '@/test/render'
import { ApiError, request } from './httpClient'
import { getAuthToken, setAuthToken } from './token'

describe('request', () => {
  it('sends the token and returns JSON', async () => {
    setAuthToken('abc')
    const fetchMock = mockFetch(200, { ok: true })
    await expect(request('/thing')).resolves.toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/thing')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer abc')
  })

  it('turns FastAPI errors into readable messages', async () => {
    mockFetch(409, { detail: 'Already sent' })
    await expect(request('/x')).rejects.toEqual(new ApiError(409, 'Already sent'))

    mockFetch(422, { detail: [{ msg: 'Value error, At least one course is required' }] })
    await expect(request('/x')).rejects.toThrow('At least one course is required')
  })

  it('signs out when the token is rejected', async () => {
    setAuthToken('expired')
    mockFetch(401, { detail: 'Not authenticated' })
    await expect(request('/x')).rejects.toBeInstanceOf(ApiError)
    expect(getAuthToken()).toBeNull()
  })

  it('handles empty responses', async () => {
    mockFetch(204, null)
    await expect(request('/x', { method: 'POST' })).resolves.toBeUndefined()
  })
})
