import type { ProfileSummary } from '@/entities/profile/@x/student'

export type SessionStatus = 'proposed' | 'accepted' | 'declined' | 'cancelled'
export type SessionFormat = 'in_person' | 'online'
export type SessionScope = 'upcoming' | 'past'

export type StudySession = {
  id: number
  /** Set for sessions of a connected pair. */
  connection_id: number | null
  /** Set for sessions of a study group. */
  group_id: number | null
  proposer_id: number
  title: string
  starts_at: string
  duration_minutes: number
  format: SessionFormat
  location: string
  status: SessionStatus
  created_at: string
  responded_at: string | null
}

export type StudySessionListItem = StudySession & {
  partner: ProfileSummary | null
  group: { id: number; name: string; owner_id: number } | null
}

export type StudySessionDto = {
  title: string
  starts_at: string
  duration_minutes: number
  format: SessionFormat
  location: string
}
