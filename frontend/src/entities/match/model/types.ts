import type { StudyDay, StudyFormat } from '@/entities/profile/@x/student'

export type MatchStatus = 'none' | 'outgoing' | 'incoming' | 'connected' | 'declined'

export type MatchCandidate = {
  user_id: number
  full_name: string
  university: string
  year_of_study: number
  major: string
  study_format: StudyFormat
  shared_courses: string[]
  shared_days: StudyDay[]
  score: number
  status: MatchStatus
  request_id: number | null
  connection_id: number | null
}
