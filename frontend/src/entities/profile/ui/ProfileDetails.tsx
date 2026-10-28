import type { ReactNode } from 'react'
import { Avatar, Tag, TagList } from '@/shared/ui'
import { studyDayLabel, studyFormatLabel, yearLabel } from '../model/constants'
import type { Profile } from '../model/types'
import styles from './ProfileDetails.module.css'

export function ProfileDetails({ profile, actions }: { profile: Profile; actions?: ReactNode }) {
  return (
    <>
      <div className={styles.head}>
        <Avatar name={profile.full_name} size={64} />
        <div className={styles.identity}>
          <h2 className={styles.name}>{profile.full_name}</h2>
          <p className={styles.email}>{profile.email}</p>
        </div>
        {actions}
      </div>
      <dl className={styles.facts}>
        <dt className={styles.label}>University</dt>
        <dd className={styles.value}>{profile.university}</dd>
        <dt className={styles.label}>Year of study</dt>
        <dd className={styles.value}>{yearLabel(profile.year_of_study)}</dd>
        <dt className={styles.label}>Major or program</dt>
        <dd className={styles.value}>{profile.major}</dd>
        <dt className={styles.label}>Courses</dt>
        <dd className={styles.value}>
          <TagList>
            {profile.courses.map((course) => (
              <Tag key={course} tone="selected">
                {course}
              </Tag>
            ))}
          </TagList>
        </dd>
        <dt className={styles.label}>Prefers to study</dt>
        <dd className={styles.value}>{studyFormatLabel(profile.study_format)}</dd>
        <dt className={styles.label}>Best days</dt>
        <dd className={styles.value}>
          <TagList>
            {profile.study_days.map((day) => (
              <Tag key={day}>{studyDayLabel(day)}</Tag>
            ))}
          </TagList>
        </dd>
      </dl>
    </>
  )
}
