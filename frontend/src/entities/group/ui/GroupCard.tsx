import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { studyDayLabel } from '@/entities/profile/@x/student'
import { Tag, TagList } from '@/shared/ui'
import type { Group } from '../model/types'
import styles from './GroupCard.module.css'

type GroupCardProps = {
  group: Group
  /** Group page address; the name becomes a link when given. */
  to?: string
  footer?: ReactNode
}

export function GroupCard({ group, to, footer }: GroupCardProps) {
  const full = group.member_count >= group.max_members

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div>
          {to ? (
            <Link to={to} className={styles.name}>
              {group.name}
            </Link>
          ) : (
            <h3 className={styles.name}>{group.name}</h3>
          )}
          <p className={styles.meta}>Organised by {group.owner.full_name}</p>
        </div>
        <div className={styles.spots}>
          <span className={styles.spotsValue}>
            {group.member_count}/{group.max_members}
          </span>
          <span className={styles.spotsLabel}>{full ? 'full' : 'members'}</span>
        </div>
      </div>
      {group.description && <p className={styles.description}>{group.description}</p>}
      <div className={styles.facts}>
        <Tag tone="selected">{group.course}</Tag>
        {group.common_days.length > 0 ? (
          <TagList>
            <span>Everyone can study:</span>
            {group.common_days.map((day) => (
              <Tag key={day}>{studyDayLabel(day)}</Tag>
            ))}
          </TagList>
        ) : (
          <span>No day that suits everyone yet</span>
        )}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </article>
  )
}
