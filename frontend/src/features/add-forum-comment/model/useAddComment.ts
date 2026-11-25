import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addComment, forumKeys } from '@/entities/forum-post'

export function useAddComment(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => addComment(postId, body),
    onSuccess: (post) => {
      queryClient.setQueryData(forumKeys.detail(postId), post)
      queryClient.invalidateQueries({ queryKey: forumKeys.lists })
    },
  })
}
