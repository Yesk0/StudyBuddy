import { request } from '@/shared/api'
import type { MatchCandidate } from '../model/types'

export function getMatches(course: string | null): Promise<MatchCandidate[]> {
  const query = course ? `?${new URLSearchParams({ course })}` : ''
  return request<MatchCandidate[]>(`/matches${query}`)
}
