import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getMatches } from '../api/matchApi'

export const matchKeys = {
  all: ['matches'] as const,
  list: (course: string | null) => ['matches', course ?? 'all'] as const,
}

export function useMatches(course: string | null) {
  return useQuery({
    queryKey: matchKeys.list(course),
    queryFn: () => getMatches(course),
    placeholderData: keepPreviousData,
  })
}
