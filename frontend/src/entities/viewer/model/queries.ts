import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { getAuthToken, subscribeToAuthToken } from '@/shared/api'
import { getViewer } from '../api/viewerApi'

export const viewerKeys = {
  me: ['viewer'] as const,
}

export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribeToAuthToken, getAuthToken)
}

export function useViewer() {
  const token = useAuthToken()
  return useQuery({
    queryKey: viewerKeys.me,
    queryFn: getViewer,
    enabled: Boolean(token),
    staleTime: Infinity,
  })
}
