import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PostCard, useForumPost } from '@/entities/forum-post'
import { CommentForm } from '@/features/add-forum-comment'
import { DeleteCommentButton, DeletePostButton } from '@/features/delete-forum-entry'
import { SendRequestForm } from '@/features/send-study-request'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { formatShortTimestamp } from '@/shared/lib'
import { Alert, Avatar, Button, ButtonLink, PageLoader, Panel, SectionLabel } from '@/shared/ui'
import styles from './ForumPostView.module.css'

export function ForumPostView({ postId }: { postId: number }) {
  const navigate = useNavigate()
  const { data: post, isPending, isError, error } = useForumPost(postId)
  const [requesting, setRequesting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  if (isPending) return <PageLoader />
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>

  return (
    <div className={styles.view}>
      <PostCard
        post={post}
        actions={post.is_mine && <DeletePostButton postId={post.id} onDeleted={() => navigate(ROUTES.forum)} />}
      />

      {!post.is_mine && (
        <Panel className={styles.reach}>
          <p className={styles.reachText}>
            Want to study with {post.author.full_name}? Send a study request, or start a group others
            can join.
          </p>
          <div className={styles.reachActions}>
            {requestSent ? (
              <span className={styles.sent}>Request sent ✓</span>
            ) : (
              !requesting && (
                <Button size="sm" onClick={() => setRequesting(true)}>
                  Send study request
                </Button>
              )
            )}
            <ButtonLink to={ROUTES.newGroup(post.course)} size="sm" variant="secondary">
              Start a study group
            </ButtonLink>
          </div>
          {requesting && (
            <SendRequestForm
              receiverId={post.author.user_id}
              courses={post.course ? [post.course] : []}
              onClose={() => setRequesting(false)}
              onSent={() => setRequestSent(true)}
            />
          )}
        </Panel>
      )}

      <section>
        <SectionLabel>Comments · {post.comments.length}</SectionLabel>
        <ul className={styles.comments}>
          {post.comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              <Avatar name={comment.author.full_name} size={34} />
              <div className={styles.commentMain}>
                <div className={styles.commentHead}>
                  <span className={styles.commentAuthor}>{comment.author.full_name}</span>
                  <time className={styles.commentTime} dateTime={comment.created_at}>
                    {formatShortTimestamp(comment.created_at)}
                  </time>
                  {comment.is_mine && <DeleteCommentButton commentId={comment.id} postId={post.id} />}
                </div>
                <p className={styles.commentBody}>{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <Panel className={styles.newComment}>
          <CommentForm postId={post.id} />
        </Panel>
      </section>
    </div>
  )
}
