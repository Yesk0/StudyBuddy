import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMyProfile } from '@/entities/profile'
import { CreatePostForm } from '@/features/create-forum-post'
import { ROUTES } from '@/shared/config'
import { Button, Page } from '@/shared/ui'
import { ForumFeed } from '@/widgets/forum-feed'

export function ForumPage() {
  const navigate = useNavigate()
  const [writing, setWriting] = useState(false)
  const { data: profile } = useMyProfile()
  const myCourses = profile?.courses ?? []

  return (
    <Page
      title="Forum"
      subtitle="Looking for someone to prepare for a midterm or final? Post it here."
      actions={
        !writing && (
          <Button size="md" onClick={() => setWriting(true)}>
            New post
          </Button>
        )
      }
    >
      {writing && profile && (
        <CreatePostForm
          myCourses={myCourses}
          onCreated={(post) => navigate(ROUTES.forumPost(post.id))}
          onCancel={() => setWriting(false)}
        />
      )}
      <ForumFeed myCourses={myCourses} />
    </Page>
  )
}
