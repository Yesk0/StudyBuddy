import { useMutation, useQueryClient } from '@tanstack/react-query'
import { groupKeys, joinGroup, respondToJoin } from '@/entities/group'

function useRefreshGroups() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: groupKeys.all })
}

export function useJoinGroup(groupId: number) {
  const onSettled = useRefreshGroups()
  return useMutation({ mutationFn: (message: string) => joinGroup(groupId, message), onSettled })
}

export function useCancelJoinRequest() {
  const onSettled = useRefreshGroups()
  return useMutation({
    mutationFn: (requestId: number) => respondToJoin(requestId, 'cancel'),
    onSettled,
  })
}
