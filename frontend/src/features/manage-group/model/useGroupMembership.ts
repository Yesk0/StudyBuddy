import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  groupKeys,
  leaveGroup,
  removeMember,
  respondToJoin,
  type JoinAction,
} from '@/entities/group'
import { sessionKeys } from '@/entities/study-session'

/** Membership changes also change which group sessions the user sees. */
function useRefreshGroups() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: groupKeys.all })
    queryClient.invalidateQueries({ queryKey: sessionKeys.all })
  }
}

export function useRespondToJoin(requestId: number) {
  const onSettled = useRefreshGroups()
  return useMutation({ mutationFn: (action: JoinAction) => respondToJoin(requestId, action), onSettled })
}

export function useRemoveMember(groupId: number) {
  const onSettled = useRefreshGroups()
  return useMutation({ mutationFn: (userId: number) => removeMember(groupId, userId), onSettled })
}

export function useLeaveGroup(groupId: number) {
  const onSettled = useRefreshGroups()
  return useMutation({ mutationFn: () => leaveGroup(groupId), onSettled })
}
