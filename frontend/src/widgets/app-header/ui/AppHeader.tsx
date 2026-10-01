import { ProgressBar } from '@/shared/ui'
import styles from './AppHeader.module.css'

type AppHeaderProps = {
  step: number
  totalSteps: number
}

export function AppHeader({ step, totalSteps }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        StudyBuddy
      </div>
      <div className={styles.progress}>
        <span>
          Step {step} of {totalSteps}
        </span>
        <ProgressBar value={step} max={totalSteps} />
      </div>
    </header>
  )
}
