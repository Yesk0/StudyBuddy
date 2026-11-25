import { describe, expect, it } from 'vitest'
import { addMinutes, formatFromNow, toDateTimeLocalValue } from './date'

const NOW = Date.parse('2026-11-24T12:00:00Z')

describe('date helpers', () => {
  it('describes how far away a time is', () => {
    expect(formatFromNow(new Date(NOW + 25 * 60_000), NOW)).toBe('in 25 minutes')
    expect(formatFromNow(new Date(NOW + 3 * 3_600_000), NOW)).toBe('in 3 hours')
    expect(formatFromNow(new Date(NOW + 24 * 3_600_000), NOW)).toBe('tomorrow')
    expect(formatFromNow(new Date(NOW - 2 * 86_400_000), NOW)).toBe('2 days ago')
  })

  it('adds minutes', () => {
    expect(addMinutes('2026-11-24T12:00:00Z', 90).toISOString()).toBe('2026-11-24T13:30:00.000Z')
  })

  it('formats a value for datetime-local inputs in local time', () => {
    expect(toDateTimeLocalValue(new Date(2026, 0, 5, 9, 7))).toBe('2026-01-05T09:07')
  })
})
