import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '@/entities/connection'
import {
  respondToSession,
  sessionHost,
  sessionKeys,
  type SessionAction,
  type StudySession,
} from '@/entities/study-session'

export function useRespondToSession(session: StudySession) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: SessionAction) => respondToSession(session.id, action),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(sessionHost(session)) })
    },
  })
}
