import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup, groupKeys } from '@/entities/group'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  })
}
