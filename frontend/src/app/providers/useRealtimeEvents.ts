import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  appendMessageToCache,
  connectionKeys,
  messageKeys,
  type Message,
} from '@/entities/connection'
import { forumKeys } from '@/entities/forum-post'
import { groupKeys } from '@/entities/group'
import { matchKeys } from '@/entities/match'
import { requestKeys } from '@/entities/study-request'
import { sessionKeys, type StudySession } from '@/entities/study-session'
import { connectRealtime, type RealtimeEvent } from '@/shared/api'

/** Keeps cached data in sync with server pushes while the user is signed in. */
export function useRealtimeEvents(token: string | null): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return

    const invalidate = (...keys: readonly (readonly unknown[])[]) =>
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))

    const handle = (event: RealtimeEvent) => {
      switch (event.type) {
        case 'request.created':
        case 'request.updated':
          invalidate(requestKeys.all, matchKeys.all, connectionKeys.list)
          break
        case 'message.created': {
          const message = event.payload as Message
          appendMessageToCache(queryClient, message)
          if (message.connection_id !== null) invalidate(connectionKeys.list)
          if (message.session) invalidate(sessionKeys.all)
          break
        }
        case 'session.updated': {
          const session = event.payload as StudySession
          invalidate(sessionKeys.all)
          if (session.group_id !== null) {
            invalidate(messageKeys.thread({ kind: 'group', id: session.group_id }))
          } else if (session.connection_id !== null) {
            invalidate(messageKeys.thread({ kind: 'connection', id: session.connection_id }))
          }
          break
        }
        case 'group.updated':
          invalidate(groupKeys.all, sessionKeys.all)
          break
        case 'forum.updated': {
          const { post_id: postId } = event.payload as { post_id: number }
          invalidate(forumKeys.detail(postId), forumKeys.lists)
          break
        }
      }
    }

    // After a reconnect we may have missed events, so refresh everything that is cached.
    return connectRealtime(token, handle, () => queryClient.invalidateQueries())
  }, [token, queryClient])
}
