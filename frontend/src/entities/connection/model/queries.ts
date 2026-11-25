import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getConnection, listConnections, listMessages } from '../api/connectionApi'
import { threadOf, type Message, type Thread, type ThreadMessages } from './types'

export const MESSAGES_PAGE_SIZE = 50

export const connectionKeys = {
  all: ['connections'] as const,
  list: ['connections', 'list'] as const,
  detail: (id: number) => ['connections', 'detail', id] as const,
}

export const messageKeys = {
  thread: (thread: Thread) => ['messages', thread.kind, thread.id] as const,
}

export function useConnections() {
  return useQuery({ queryKey: connectionKeys.list, queryFn: listConnections })
}

export function useConnection(connectionId: number) {
  return useQuery({
    queryKey: connectionKeys.detail(connectionId),
    queryFn: () => getConnection(connectionId),
  })
}

/** Latest messages of a conversation, with a way to page back through older ones. */
export function useThreadMessages(thread: Thread) {
  const queryClient = useQueryClient()
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const query = useQuery({
    queryKey: messageKeys.thread(thread),
    queryFn: async (): Promise<ThreadMessages> => {
      const messages = await listMessages(thread, { limit: MESSAGES_PAGE_SIZE })
      return { messages, hasMore: messages.length === MESSAGES_PAGE_SIZE }
    },
  })

  const loadEarlier = async () => {
    const oldest = query.data?.messages[0]
    if (!oldest || loadingEarlier) return
    setLoadingEarlier(true)
    try {
      const older = await listMessages(thread, { limit: MESSAGES_PAGE_SIZE, beforeId: oldest.id })
      queryClient.setQueryData<ThreadMessages>(messageKeys.thread(thread), (current) => {
        if (!current) return current
        const known = new Set(current.messages.map((message) => message.id))
        return {
          messages: [...older.filter((message) => !known.has(message.id)), ...current.messages],
          hasMore: older.length === MESSAGES_PAGE_SIZE,
        }
      })
    } finally {
      setLoadingEarlier(false)
    }
  }

  return { ...query, loadEarlier, loadingEarlier }
}

/** Adds a message to its cached conversation, ignoring duplicates (REST reply + socket event). */
export function appendMessageToCache(queryClient: QueryClient, message: Message): void {
  queryClient.setQueryData<ThreadMessages>(messageKeys.thread(threadOf(message)), (current) => {
    if (!current || current.messages.some((existing) => existing.id === message.id)) return current
    return { ...current, messages: [...current.messages, message] }
  })
}
