import { useQuery } from '@tanstack/react-query'
import { listSessions } from '../api/sessionApi'
import type { SessionScope } from './types'

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (scope: SessionScope) => ['sessions', scope] as const,
}

export function useSessions(scope: SessionScope, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.list(scope),
    queryFn: () => listSessions(scope),
    enabled,
  })
}
