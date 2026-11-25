import type { StudySession } from '../model/types'
import { sessionEndsAt } from './sessionTime'

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** RFC 5545 text escaping. */
function escape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

/** Folds lines longer than 75 octets, as the calendar format requires. */
function fold(line: string): string {
  const parts = []
  for (let index = 0; index < line.length; index += 73) parts.push(line.slice(index, index + 73))
  return parts.join('\r\n ')
}

export function toIcs(session: StudySession, withWhom: string): string {
  const where = [session.format === 'online' ? 'Online' : 'In person', session.location]
    .filter(Boolean)
    .join(' · ')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyBuddy//Study sessions//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:study-session-${session.id}@studybuddy`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(new Date(session.starts_at))}`,
    `DTEND:${icsDate(sessionEndsAt(session))}`,
    `SUMMARY:${escape(session.title)}`,
    `DESCRIPTION:${escape(`Study session with ${withWhom} (StudyBuddy)`)}`,
    `LOCATION:${escape(where)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(session.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadIcs(session: StudySession, withWhom: string): void {
  const blob = new Blob([toIcs(session, withWhom)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${session.title.replace(/[^\w\- ]+/g, '').trim() || 'study-session'}.ics`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
