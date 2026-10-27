import { postJson, request } from '@/shared/api'
import type { RequestBox, StudyRequest, StudyRequestDto } from '../model/types'

export function listRequests(box: RequestBox): Promise<StudyRequest[]> {
  return request<StudyRequest[]>(`/requests?box=${box}`)
}

export function createRequest(dto: StudyRequestDto): Promise<StudyRequest> {
  return postJson<StudyRequest>('/requests', dto)
}

export type RequestAction = 'accept' | 'decline' | 'cancel'

export function respondToRequest(requestId: number, action: RequestAction): Promise<StudyRequest> {
  return postJson<StudyRequest>(`/requests/${requestId}/${action}`)
}
