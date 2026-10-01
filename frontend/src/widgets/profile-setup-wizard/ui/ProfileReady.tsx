import { FormCard } from '@/shared/ui'
import styles from './ProfileReady.module.css'

const PROFILE_INCLUDES = ['University email', 'Major and courses', 'Study format and available days']

function CheckIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ProfileReady({ onEdit }: { onEdit: () => void }) {
  return (
    <FormCard
      title="Your profile is ready"
      subtitle="You’re all set to find your first study partner."
      submitLabel="Edit profile"
      onSubmit={onEdit}
    >
      <div className={styles.badge}>
        <CheckIcon size={36} strokeWidth={3} />
      </div>
      <h2 className={styles.heading}>Nice work!</h2>
      <p className={styles.text}>
        Your StudyBuddy profile is complete. We’ll use your courses and study preferences to find a
        good study partner.
      </p>
      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>Profile includes</h3>
        <ul className={styles.list}>
          {PROFILE_INCLUDES.map((item) => (
            <li key={item} className={styles.item}>
              <CheckIcon size={12} strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </FormCard>
  )
}
