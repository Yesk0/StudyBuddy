import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { appendMessageToCache, connectionKeys, type Message } from '@/entities/connection'
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
          invalidate(connectionKeys.list)
          if (message.session) invalidate(sessionKeys.all)
          break
        }
        case 'session.updated': {
          const session = event.payload as StudySession
          invalidate(sessionKeys.all, connectionKeys.messages(session.connection_id))
          break
        }
      }
    }

    // After a reconnect we may have missed events, so refresh everything that is cached.
    return connectRealtime(token, handle, () => queryClient.invalidateQueries())
  }, [token, queryClient])
}
