import { postJson, request } from '@/shared/api'
import type { ForumFilters, ForumPost, ForumPostDetail, ForumPostDto } from '../model/types'

export const FORUM_PAGE_SIZE = 20

export function listPosts(filters: ForumFilters, beforeId?: number): Promise<ForumPost[]> {
  const params = new URLSearchParams({ limit: String(FORUM_PAGE_SIZE) })
  if (filters.course) params.set('course', filters.course)
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (beforeId !== undefined) params.set('before_id', String(beforeId))
  return request<ForumPost[]>(`/forum/posts?${params}`)
}

export function getPost(postId: number): Promise<ForumPostDetail> {
  return request<ForumPostDetail>(`/forum/posts/${postId}`)
}

export function createPost(dto: ForumPostDto): Promise<ForumPostDetail> {
  return postJson<ForumPostDetail>('/forum/posts', dto)
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/forum/posts/${postId}`, { method: 'DELETE' })
}

export function addComment(postId: number, body: string): Promise<ForumPostDetail> {
  return postJson<ForumPostDetail>(`/forum/posts/${postId}/comments`, { body })
}

export function deleteComment(commentId: number): Promise<ForumPostDetail> {
  return request<ForumPostDetail>(`/forum/comments/${commentId}`, { method: 'DELETE' })
}
