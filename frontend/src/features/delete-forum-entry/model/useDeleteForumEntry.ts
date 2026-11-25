import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteComment, deletePost, forumKeys } from '@/entities/forum-post'

export function useDeletePost(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: forumKeys.detail(postId) })
      queryClient.invalidateQueries({ queryKey: forumKeys.all })
    },
  })
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (post) => {
      queryClient.setQueryData(forumKeys.detail(postId), post)
      queryClient.invalidateQueries({ queryKey: forumKeys.lists })
    },
  })
}
