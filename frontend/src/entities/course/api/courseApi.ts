import { request } from '@/shared/api'

export type Course = { id: number; name: string; students: number }

export function searchCourses(search: string): Promise<Course[]> {
  return request<Course[]>(`/courses?${new URLSearchParams({ search, limit: '8' })}`)
}
