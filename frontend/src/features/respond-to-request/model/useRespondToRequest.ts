import { useMutation, useQueryClient } from '@tanstack/react-query'
import { connectionKeys } from '@/entities/connection'
import { matchKeys } from '@/entities/match'
import { requestKeys, respondToRequest, type RequestAction } from '@/entities/study-request'

export function useRespondToRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: number; action: RequestAction }) =>
      respondToRequest(requestId, action),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}
