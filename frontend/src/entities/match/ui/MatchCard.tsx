import type { ReactNode } from 'react'
import { studyDayLabel, studyFormatLabel, yearLabel } from '@/entities/profile/@x/student'
import { Avatar, Tag, TagList } from '@/shared/ui'
import type { MatchCandidate } from '../model/types'
import styles from './MatchCard.module.css'

type MatchCardProps = {
  match: MatchCandidate
  footer?: ReactNode
}

export function MatchCard({ match, footer }: MatchCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <Avatar name={match.full_name} size={48} />
        <div className={styles.identity}>
          <h3 className={styles.name}>{match.full_name}</h3>
          <p className={styles.meta}>
            {[yearLabel(match.year_of_study), match.major, match.university].join(' · ')}
          </p>
        </div>
        <div className={styles.score} title="Based on shared courses, days and study format">
          <span className={styles.scoreValue}>{match.score}%</span>
          <span className={styles.scoreLabel}>match</span>
        </div>
      </div>

      <dl className={styles.facts}>
        <dt className={styles.factLabel}>Shared courses</dt>
        <dd>
          <TagList>
            {match.shared_courses.map((course) => (
              <Tag key={course} tone="selected">
                {course}
              </Tag>
            ))}
          </TagList>
        </dd>
        <dt className={styles.factLabel}>Common days</dt>
        <dd>
          {match.shared_days.length > 0 ? (
            <TagList>
              {match.shared_days.map((day) => (
                <Tag key={day}>{studyDayLabel(day)}</Tag>
              ))}
            </TagList>
          ) : (
            <span className={styles.none}>No overlap yet</span>
          )}
        </dd>
        <dt className={styles.factLabel}>Prefers</dt>
        <dd>
          <Tag>{studyFormatLabel(match.study_format)}</Tag>
        </dd>
      </dl>

      {footer && <div className={styles.footer}>{footer}</div>}
    </article>
  )
}
