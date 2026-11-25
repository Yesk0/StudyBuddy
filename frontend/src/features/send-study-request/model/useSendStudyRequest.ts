import { useMutation, useQueryClient } from '@tanstack/react-query'
import { matchKeys } from '@/entities/match'
import { createRequest, requestKeys } from '@/entities/study-request'

export function useSendStudyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}
