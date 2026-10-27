import { addMinutes, formatDate, formatTime, TIME } from '@/shared/lib'
import type { StudySession } from '../model/types'

export function sessionEndsAt(session: StudySession): Date {
  return addMinutes(session.starts_at, session.duration_minutes)
}

export function formatSessionTime(session: StudySession): string {
  return `${formatDate(session.starts_at)} · ${formatTime(session.starts_at)}–${formatTime(sessionEndsAt(session))}`
}

/** Accepted and starting within the next 24 hours (or already running). */
export function isSessionSoon(session: StudySession, now = Date.now()): boolean {
  if (session.status !== 'accepted') return false
  const startsIn = new Date(session.starts_at).getTime() - now
  return startsIn <= TIME.DAY && sessionEndsAt(session).getTime() > now
}

export function isSessionInProgress(session: StudySession, now = Date.now()): boolean {
  return new Date(session.starts_at).getTime() <= now && sessionEndsAt(session).getTime() > now
}
