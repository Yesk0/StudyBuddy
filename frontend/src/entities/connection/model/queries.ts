import { useQuery, type QueryClient } from '@tanstack/react-query'
import { getConnection, listConnections, listMessages } from '../api/connectionApi'
import type { Message } from './types'

export const connectionKeys = {
  all: ['connections'] as const,
  list: ['connections', 'list'] as const,
  detail: (id: number) => ['connections', 'detail', id] as const,
  messages: (id: number) => ['connections', 'messages', id] as const,
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

export function useMessages(connectionId: number) {
  return useQuery({
    queryKey: connectionKeys.messages(connectionId),
    queryFn: () => listMessages(connectionId),
  })
}

/** Adds a message to the cached conversation, ignoring duplicates (REST reply + socket event). */
export function appendMessageToCache(queryClient: QueryClient, message: Message): void {
  queryClient.setQueryData<Message[]>(connectionKeys.messages(message.connection_id), (messages) => {
    if (!messages || messages.some((existing) => existing.id === message.id)) return messages
    return [...messages, message]
  })
}
