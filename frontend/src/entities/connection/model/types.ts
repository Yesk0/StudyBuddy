import type { ProfileSummary } from '@/entities/profile/@x/student'
import type { StudySession } from '@/entities/study-session/@x/connection'

/** A conversation: the chat of a connected pair or of a study group. */
export type Thread = { kind: 'connection' | 'group'; id: number }

export type Message = {
  id: number
  connection_id: number | null
  group_id: number | null
  sender_id: number
  body: string
  created_at: string
  /** Present when the message announces a study session. */
  session: StudySession | null
}

export type ThreadMessages = {
  messages: Message[]
  /** Whether older messages exist on the server. */
  hasMore: boolean
}

export type Connection = {
  id: number
  partner: ProfileSummary
  shared_courses: string[]
  created_at: string
  last_message: Message | null
}

export function threadOf(message: Message): Thread {
  return message.group_id !== null
    ? { kind: 'group', id: message.group_id }
    : { kind: 'connection', id: message.connection_id! }
}
