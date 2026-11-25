import type { ProfileSummary, StudyDay } from '@/entities/profile/@x/student'

export type JoinRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'
export type GroupScope = 'discover' | 'mine'

export type Group = {
  id: number
  name: string
  description: string
  course: string
  max_members: number
  member_count: number
  owner: ProfileSummary
  /** Days on which the viewer and every member can study. */
  common_days: StudyDay[]
  is_member: boolean
  is_owner: boolean
  my_request: { id: number; status: JoinRequestStatus } | null
  created_at: string
}

export type GroupMember = ProfileSummary & { is_owner: boolean; joined_at: string }

export type GroupJoinRequest = {
  id: number
  group_id: number
  group_name: string
  user: ProfileSummary
  message: string
  status: JoinRequestStatus
  created_at: string
}

export type GroupDetail = Group & {
  members: GroupMember[]
  /** Only filled for the owner. */
  pending_requests: GroupJoinRequest[]
}

export type GroupDto = {
  name: string
  course: string
  description: string
  max_members: number
}
