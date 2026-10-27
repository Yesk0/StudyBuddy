import type { ReactNode } from 'react'
import { cx, formatFromNow, useNow } from '@/shared/lib'
import { Tag, type TagTone } from '@/shared/ui'
import { formatSessionTime, isSessionInProgress, isSessionSoon } from '../lib/sessionTime'
import type { SessionStatus, StudySession } from '../model/types'
import styles from './SessionCard.module.css'

const STATUS: Record<SessionStatus, { label: string; tone: TagTone }> = {
  proposed: { label: 'Waiting for answer', tone: 'warning' },
  accepted: { label: 'Confirmed', tone: 'success' },
  declined: { label: 'Declined', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

type SessionCardProps = {
  session: StudySession
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}

export function SessionCard({ session, eyebrow, actions, className }: SessionCardProps) {
  const now = useNow()
  const status = STATUS[session.status]
  const active = session.status === 'proposed' || session.status === 'accepted'
  const inProgress = active && isSessionInProgress(session, now)
  const upcoming = active && new Date(session.starts_at).getTime() > now

  return (
    <article className={cx(styles.card, isSessionSoon(session, now) && styles.soon, className)}>
      <div className={styles.top}>
        <div>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h3 className={styles.title}>{session.title}</h3>
        </div>
        <Tag tone={status.tone}>{status.label}</Tag>
      </div>
      <div className={styles.meta}>
        <span>{formatSessionTime(session)}</span>
        {upcoming && (
          <span className={styles.relative}>Starts {formatFromNow(session.starts_at, now)}</span>
        )}
        {inProgress && <span className={styles.relative}>Happening now</span>}
      </div>
      <div className={styles.meta}>
        <span>{session.format === 'online' ? 'Online' : 'In person'}</span>
        {session.location && <span className={styles.location}>{session.location}</span>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
