import type { ProfileSummary } from '@/entities/profile/@x/student'

export type SessionStatus = 'proposed' | 'accepted' | 'declined' | 'cancelled'
export type SessionFormat = 'in_person' | 'online'
export type SessionScope = 'upcoming' | 'past'

export type StudySession = {
  id: number
  connection_id: number
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

export type StudySessionListItem = StudySession & { partner: ProfileSummary }

export type StudySessionDto = {
  title: string
  starts_at: string
  duration_minutes: number
  format: SessionFormat
  location: string
}
