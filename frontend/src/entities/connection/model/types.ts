import type { ProfileSummary } from '@/entities/profile/@x/student'
import type { StudySession } from '@/entities/study-session/@x/connection'

export type Message = {
  id: number
  connection_id: number
  sender_id: number
  body: string
  created_at: string
  /** Present when the message announces a study session proposal. */
  session: StudySession | null
}

export type Connection = {
  id: number
  partner: ProfileSummary
  shared_courses: string[]
  created_at: string
  last_message: Message | null
}
