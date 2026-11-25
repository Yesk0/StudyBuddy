import { ConfirmButton } from '@/shared/ui'
import { useDeleteComment, useDeletePost } from '../model/useDeleteForumEntry'

export function DeletePostButton({ postId, onDeleted }: { postId: number; onDeleted: () => void }) {
  const remove = useDeletePost(postId)
  return (
    <ConfirmButton
      confirmLabel="Delete post"
      disabled={remove.isPending}
      onConfirm={() => remove.mutate(undefined, { onSuccess: onDeleted })}
    >
      Delete
    </ConfirmButton>
  )
}

export function DeleteCommentButton({ commentId, postId }: { commentId: number; postId: number }) {
  const remove = useDeleteComment(postId)
  return (
    <ConfirmButton
      confirmLabel="Delete comment"
      disabled={remove.isPending}
      onConfirm={() => remove.mutate(commentId)}
    >
      Delete
    </ConfirmButton>
  )
}
