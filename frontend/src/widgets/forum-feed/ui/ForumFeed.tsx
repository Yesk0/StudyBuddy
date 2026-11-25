import { useState } from 'react'
import { PostCard, useForumPosts } from '@/entities/forum-post'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { useDebounced } from '@/shared/lib'
import { Alert, Button, Chip, ChipGroup, EmptyState, PageLoader, Panel, TextField } from '@/shared/ui'
import styles from './ForumFeed.module.css'

export function ForumFeed({ myCourses }: { myCourses: string[] }) {
  const [course, setCourse] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search)
  const posts = useForumPosts({ course, search: debouncedSearch })
  const items = posts.data?.pages.flat() ?? []

  return (
    <>
      <div className={styles.filters}>
        <TextField
          className={styles.search}
          title="Search posts"
          type="search"
          placeholder="e.g. midterm, final, Calculus"
          value={search}
          onChange={setSearch}
        />
        <ChipGroup aria-label="Filter by course">
          <Chip selected={course === null} aria-pressed={course === null} onClick={() => setCourse(null)}>
            All courses
          </Chip>
          {myCourses.map((name) => (
            <Chip key={name} selected={course === name} aria-pressed={course === name} onClick={() => setCourse(name)}>
              {name}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {posts.isPending && <PageLoader />}
      {posts.isError && <Alert tone="error">{errorMessage(posts.error)}</Alert>}
      {posts.isSuccess && items.length === 0 && (
        <Panel>
          <EmptyState
            title={debouncedSearch || course ? 'Nothing found' : 'No posts yet'}
            text={
              debouncedSearch || course
                ? 'Try another search or course.'
                : 'Be the first: tell others which exam you are preparing for.'
            }
          />
        </Panel>
      )}
      <div className={styles.list}>
        {items.map((post) => (
          <PostCard key={post.id} post={post} to={ROUTES.forumPost(post.id)} />
        ))}
      </div>
      {posts.hasNextPage && (
        <Button
          className={styles.more}
          variant="secondary"
          size="md"
          disabled={posts.isFetchingNextPage}
          onClick={() => posts.fetchNextPage()}
        >
          {posts.isFetchingNextPage ? 'Loading…' : 'Show older posts'}
        </Button>
      )}
    </>
  )
}
