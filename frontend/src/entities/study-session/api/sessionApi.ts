import { postJson, request } from '@/shared/api'
import type {
  SessionScope,
  StudySession,
  StudySessionDto,
  StudySessionListItem,
} from '../model/types'

export function proposeSession(connectionId: number, dto: StudySessionDto): Promise<StudySession> {
  return postJson<StudySession>(`/connections/${connectionId}/sessions`, dto)
}

export function listSessions(scope: SessionScope): Promise<StudySessionListItem[]> {
  return request<StudySessionListItem[]>(`/sessions?scope=${scope}`)
}

export type SessionAction = 'accept' | 'decline' | 'cancel'

export function respondToSession(sessionId: number, action: SessionAction): Promise<StudySession> {
  return postJson<StudySession>(`/sessions/${sessionId}/${action}`)
}
