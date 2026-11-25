import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx, formatShortTimestamp } from '@/shared/lib'
import { Avatar, Tag } from '@/shared/ui'
import type { ForumPost } from '../model/types'
import styles from './PostCard.module.css'

type PostCardProps = {
  post: ForumPost
  /** Link to the full post; without it the whole text is shown (detail view). */
  to?: string
  actions?: ReactNode
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function PostCard({ post, to, actions }: PostCardProps) {
  return (
    <article className={styles.card}>
      {to ? (
        <Link to={to} className={styles.title}>
          {post.title}
        </Link>
      ) : (
        <h1 className={styles.title}>{post.title}</h1>
      )}
      <p className={cx(styles.body, to && styles.excerpt)}>{post.body}</p>
      <div className={styles.footer}>
        <span className={styles.author}>
          <Avatar name={post.author.full_name} size={24} />
          {post.author.full_name}
        </span>
        {post.course && <Tag tone="selected">{post.course}</Tag>}
        <time dateTime={post.created_at}>{formatShortTimestamp(post.created_at)}</time>
        <span>{plural(post.comment_count, 'comment')}</span>
        {actions}
      </div>
    </article>
  )
}
