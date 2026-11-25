import { useState, type FormEvent } from 'react'
import { errorMessage } from '@/shared/api'
import { Button, TextArea } from '@/shared/ui'
import { useAddComment } from '../model/useAddComment'
import styles from './CommentForm.module.css'

export function CommentForm({ postId }: { postId: number }) {
  const [body, setBody] = useState('')
  const comment = useAddComment(postId)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (body.trim()) comment.mutate(body.trim(), { onSuccess: () => setBody('') })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextArea
        title="Add a comment"
        placeholder="I'm in! I can do Wednesdays after 5 pm."
        maxLength={2000}
        rows={3}
        value={body}
        onChange={setBody}
      />
      {comment.isError && (
        <p className={styles.error} role="alert">
          {errorMessage(comment.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" size="md" disabled={!body.trim() || comment.isPending}>
          {comment.isPending ? 'Posting…' : 'Comment'}
        </Button>
      </div>
    </form>
  )
}
