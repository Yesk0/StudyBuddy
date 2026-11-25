import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getGroup, listGroups } from '../api/groupApi'
import type { GroupScope } from './types'

export const groupKeys = {
  all: ['groups'] as const,
  list: (scope: GroupScope, course: string | null) => ['groups', 'list', scope, course ?? 'all'] as const,
  detail: (id: number) => ['groups', 'detail', id] as const,
}

export function useGroups(scope: GroupScope, course: string | null = null) {
  return useQuery({
    queryKey: groupKeys.list(scope, course),
    queryFn: () => listGroups(scope, course),
    placeholderData: keepPreviousData,
  })
}

export function useGroup(groupId: number) {
  return useQuery({ queryKey: groupKeys.detail(groupId), queryFn: () => getGroup(groupId) })
}
