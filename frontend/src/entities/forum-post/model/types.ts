import type { ProfileSummary } from '@/entities/profile/@x/student'

export type ForumComment = {
  id: number
  post_id: number
  author: ProfileSummary
  body: string
  created_at: string
  is_mine: boolean
}

export type ForumPost = {
  id: number
  title: string
  body: string
  course: string | null
  author: ProfileSummary
  comment_count: number
  created_at: string
  is_mine: boolean
}

export type ForumPostDetail = ForumPost & { comments: ForumComment[] }

export type ForumPostDto = { title: string; body: string; course: string | null }

export type ForumFilters = { course: string | null; search: string }
