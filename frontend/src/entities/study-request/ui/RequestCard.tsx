import type { ReactNode } from 'react'
import { yearLabel, type ProfileSummary } from '@/entities/profile/@x/student'
import { formatShortTimestamp } from '@/shared/lib'
import { Avatar, Tag, type TagTone } from '@/shared/ui'
import type { RequestStatus, StudyRequest } from '../model/types'
import styles from './RequestCard.module.css'

const STATUS: Record<Exclude<RequestStatus, 'pending'>, { label: string; tone: TagTone }> = {
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

type RequestCardProps = {
  request: StudyRequest
  /** The other student: sender for incoming requests, receiver for outgoing ones. */
  student: ProfileSummary
  actions?: ReactNode
}

export function RequestCard({ request, student, actions }: RequestCardProps) {
  const status = request.status === 'pending' ? null : STATUS[request.status]

  return (
    <article className={styles.card}>
      <Avatar name={student.full_name} size={44} />
      <div className={styles.main}>
        <div className={styles.head}>
          <span className={styles.name}>{student.full_name}</span>
          {status && <Tag tone={status.tone}>{status.label}</Tag>}
        </div>
        <p className={styles.meta}>
          {[yearLabel(student.year_of_study), student.major, student.university]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {request.message && <p className={styles.message}>{request.message}</p>}
        <div className={styles.footer}>
          {request.course && <Tag tone="selected">{request.course}</Tag>}
          <time className={styles.time} dateTime={request.created_at}>
            {formatShortTimestamp(request.created_at)}
          </time>
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
