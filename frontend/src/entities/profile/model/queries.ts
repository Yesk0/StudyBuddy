import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '../api/profileApi'

export const profileKeys = {
  me: ['profile', 'me'] as const,
}

export function useMyProfile() {
  return useQuery({ queryKey: profileKeys.me, queryFn: getMyProfile })
}
