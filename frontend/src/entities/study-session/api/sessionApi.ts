import { postJson, request } from '@/shared/api'
import type {
  SessionScope,
  StudySession,
  StudySessionDto,
  StudySessionListItem,
} from '../model/types'

/** Where a session is planned: a one-to-one chat or a study group. */
export type SessionHost = { kind: 'connection' | 'group'; id: number }

export function proposeSession(host: SessionHost, dto: StudySessionDto): Promise<StudySession> {
  const base = host.kind === 'group' ? 'groups' : 'connections'
  return postJson<StudySession>(`/${base}/${host.id}/sessions`, dto)
}

export function listSessions(scope: SessionScope): Promise<StudySessionListItem[]> {
  return request<StudySessionListItem[]>(`/sessions?scope=${scope}`)
}

export type SessionAction = 'accept' | 'decline' | 'cancel'

export function respondToSession(sessionId: number, action: SessionAction): Promise<StudySession> {
  return postJson<StudySession>(`/sessions/${sessionId}/${action}`)
}
