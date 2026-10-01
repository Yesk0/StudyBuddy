import { request } from '@/shared/api'
import type { Profile, ProfileDto } from '../model/types'

export function createProfile(dto: ProfileDto): Promise<Profile> {
  return request<Profile>('/profiles', { method: 'POST', body: JSON.stringify(dto) })
}

export function updateProfile(id: number, dto: ProfileDto): Promise<Profile> {
  return request<Profile>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(dto) })
}
