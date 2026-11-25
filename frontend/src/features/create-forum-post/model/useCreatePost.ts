import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost, forumKeys } from '@/entities/forum-post'

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: forumKeys.all }),
  })
}
