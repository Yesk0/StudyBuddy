import { describe, expect, it } from 'vitest'
import type { StudySession } from '../model/types'
import { isSessionInProgress, isSessionSoon, sessionEndsAt } from './sessionTime'
import { sessionHost } from './sessionHost'

const NOW = Date.parse('2026-11-24T12:00:00Z')
const HOUR = 3_600_000

function session(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: 1,
    connection_id: 7,
    group_id: null,
    proposer_id: 1,
    title: 'Databases prep',
    starts_at: new Date(NOW + 3 * HOUR).toISOString(),
    duration_minutes: 90,
    format: 'in_person',
    location: 'Library',
    status: 'accepted',
    created_at: new Date(NOW).toISOString(),
    responded_at: null,
    ...overrides,
  }
}

describe('session time', () => {
  it('computes the end from the duration', () => {
    expect(sessionEndsAt(session()).getTime()).toBe(NOW + 4.5 * HOUR)
  })

  it('is "soon" only when confirmed and within 24 hours', () => {
    expect(isSessionSoon(session(), NOW)).toBe(true)
    expect(isSessionSoon(session({ status: 'proposed' }), NOW)).toBe(false)
    const tomorrow = new Date(NOW + 30 * HOUR).toISOString()
    expect(isSessionSoon(session({ starts_at: tomorrow }), NOW)).toBe(false)
  })

  it('is in progress between start and end', () => {
    const started = session({ starts_at: new Date(NOW - HOUR).toISOString() })
    expect(isSessionInProgress(started, NOW)).toBe(true)
    expect(isSessionInProgress(started, NOW + HOUR)).toBe(false)
    expect(isSessionSoon(started, NOW)).toBe(true)
  })

  it('knows whether it belongs to a chat or a group', () => {
    expect(sessionHost(session())).toEqual({ kind: 'connection', id: 7 })
    expect(sessionHost(session({ connection_id: null, group_id: 3 }))).toEqual({
      kind: 'group',
      id: 3,
    })
  })
})
