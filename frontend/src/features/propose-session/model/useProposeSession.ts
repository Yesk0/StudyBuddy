import { useMutation, useQueryClient } from '@tanstack/react-query'
import { connectionKeys, messageKeys, type Thread } from '@/entities/connection'
import { proposeSession, sessionKeys, type StudySessionDto } from '@/entities/study-session'

export function useProposeSession(thread: Thread) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: StudySessionDto) => proposeSession(thread, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(thread) })
      queryClient.invalidateQueries({ queryKey: connectionKeys.list })
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    },
  })
}
