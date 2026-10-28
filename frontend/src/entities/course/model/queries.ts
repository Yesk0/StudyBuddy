import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchCourses } from '../api/courseApi'

/** Existing course names for autocomplete, most popular first. */
export function useCourseSearch(search: string) {
  const query = search.trim()
  return useQuery({
    queryKey: ['courses', query],
    queryFn: () => searchCourses(query),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
