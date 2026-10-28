import { ApiError, putJson, request } from '@/shared/api'
import type { Profile, ProfileDto } from '../model/types'

export async function getMyProfile(): Promise<Profile | null> {
  try {
    return await request<Profile>('/profiles/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function saveMyProfile(dto: ProfileDto): Promise<Profile> {
  return putJson<Profile>('/profiles/me', dto)
}
