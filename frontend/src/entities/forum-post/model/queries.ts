import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { FORUM_PAGE_SIZE, getPost, listPosts } from '../api/forumApi'
import type { ForumFilters } from './types'

export const forumKeys = {
  all: ['forum'] as const,
  lists: ['forum', 'list'] as const,
  list: (filters: ForumFilters) => ['forum', 'list', filters.course ?? 'all', filters.search.trim()] as const,
  detail: (id: number) => ['forum', 'detail', id] as const,
}

export function useForumPosts(filters: ForumFilters) {
  return useInfiniteQuery({
    queryKey: forumKeys.list(filters),
    queryFn: ({ pageParam }) => listPosts(filters, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) =>
      page.length === FORUM_PAGE_SIZE ? page[page.length - 1].id : undefined,
  })
}

export function useForumPost(postId: number) {
  return useQuery({ queryKey: forumKeys.detail(postId), queryFn: () => getPost(postId) })
}
