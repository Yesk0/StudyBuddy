import { postJson, request } from '@/shared/api'
import type { Group, GroupDetail, GroupDto, GroupScope } from '../model/types'

export function listGroups(scope: GroupScope, course: string | null): Promise<Group[]> {
  const params = new URLSearchParams({ scope })
  if (course) params.set('course', course)
  return request<Group[]>(`/groups?${params}`)
}

export function getGroup(groupId: number): Promise<GroupDetail> {
  return request<GroupDetail>(`/groups/${groupId}`)
}

export function createGroup(dto: GroupDto): Promise<GroupDetail> {
  return postJson<GroupDetail>('/groups', dto)
}

export function joinGroup(groupId: number, message: string): Promise<GroupDetail> {
  return postJson<GroupDetail>(`/groups/${groupId}/join`, { message })
}

export function leaveGroup(groupId: number): Promise<void> {
  return postJson<void>(`/groups/${groupId}/leave`)
}

export function removeMember(groupId: number, userId: number): Promise<GroupDetail> {
  return request<GroupDetail>(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
}

export type JoinAction = 'accept' | 'decline' | 'cancel'

export function respondToJoin(requestId: number, action: JoinAction): Promise<GroupDetail> {
  return postJson<GroupDetail>(`/group-requests/${requestId}/${action}`)
}
