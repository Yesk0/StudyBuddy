import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appendMessageToCache, connectionKeys, sendMessage, type Thread } from '@/entities/connection'

export function useSendMessage(thread: Thread) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => sendMessage(thread, body),
    onSuccess: (message) => {
      appendMessageToCache(queryClient, message)
      // The chat list shows the last message of each pair chat.
      if (thread.kind === 'connection') {
        queryClient.invalidateQueries({ queryKey: connectionKeys.list })
      }
    },
  })
}
