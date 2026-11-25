import { describe, expect, it } from 'vitest'
import type { StudySession } from '../model/types'
import { toIcs } from './toIcs'

const session: StudySession = {
  id: 42,
  connection_id: 1,
  group_id: null,
  proposer_id: 1,
  title: 'Databases; midterm, prep',
  starts_at: '2026-11-25T13:00:00.000Z',
  duration_minutes: 90,
  format: 'in_person',
  location: 'Library, room 204',
  status: 'accepted',
  created_at: '2026-11-24T10:00:00.000Z',
  responded_at: null,
}

describe('toIcs', () => {
  const ics = toIcs(session, 'Bob Marley')
  const lines = ics.split('\r\n')

  it('describes one event with UTC start and end', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines).toContain('UID:study-session-42@studybuddy')
    expect(lines).toContain('DTSTART:20261125T130000Z')
    expect(lines).toContain('DTEND:20261125T143000Z')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('escapes special characters', () => {
    expect(lines).toContain('SUMMARY:Databases\\; midterm\\, prep')
    expect(lines).toContain('LOCATION:In person · Library\\, room 204')
  })

  it('folds long lines to stay within the format limit', () => {
    const long = toIcs({ ...session, title: 'x'.repeat(200) }, 'Bob')
    for (const line of long.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75)
  })
})
