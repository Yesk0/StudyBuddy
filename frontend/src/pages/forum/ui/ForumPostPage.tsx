import { useNavigate, useParams } from 'react-router'
import { ROUTES } from '@/shared/config'
import { BackButton } from '@/shared/ui'
import { ForumPostView } from '@/widgets/forum-post-view'
import styles from './ForumPostPage.module.css'

export function ForumPostPage() {
  const navigate = useNavigate()
  const { postId } = useParams()

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <BackButton label="Forum" onClick={() => navigate(ROUTES.forum)} />
      </div>
      <ForumPostView key={postId} postId={Number(postId)} />
    </section>
  )
}
