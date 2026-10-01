import { AppHeader } from '@/widgets/app-header'
import { ProfileSetupWizard, TOTAL_STEPS, useProfileSetupWizard } from '@/widgets/profile-setup-wizard'
import styles from './ProfileSetupPage.module.css'

export function ProfileSetupPage() {
  const wizard = useProfileSetupWizard()

  return (
    <>
      <AppHeader step={wizard.stepNumber} totalSteps={TOTAL_STEPS} />
      <main className={styles.main}>
        <ProfileSetupWizard wizard={wizard} />
      </main>
    </>
  )
}
