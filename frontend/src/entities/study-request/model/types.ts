import type { ProfileSummary } from '@/entities/profile/@x/student'

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'
export type RequestBox = 'incoming' | 'outgoing'

export type StudyRequest = {
  id: number
  status: RequestStatus
  message: string
  course: string | null
  created_at: string
  responded_at: string | null
  sender: ProfileSummary
  receiver: ProfileSummary
  connection_id: number | null
}

export type StudyRequestDto = {
  receiver_id: number
  course: string | null
  message: string
}
