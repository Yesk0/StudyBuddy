import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import {
  EMPTY_PROFILE_DRAFT,
  toProfileDraft,
  useMyProfile,
  type ProfileDraft,
} from '@/entities/profile'
import { useViewer } from '@/entities/viewer'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { Alert, PageLoader } from '@/shared/ui'
import { AppHeader } from '@/widgets/app-header'
import { ProfileSetupWizard, TOTAL_STEPS, useProfileSetupWizard } from '@/widgets/profile-setup-wizard'
import styles from './ProfileSetupPage.module.css'

function Wizard({ initialDraft, onSaved }: { initialDraft: ProfileDraft; onSaved?: () => void }) {
  const wizard = useProfileSetupWizard({ initialDraft, onSaved })
  return (
    <>
      <AppHeader variant="onboarding" step={wizard.stepNumber} totalSteps={TOTAL_STEPS} />
      <main className={styles.main}>
        <ProfileSetupWizard wizard={wizard} />
      </main>
    </>
  )
}

/** First-time setup right after registration. */
export function ProfileSetupPage() {
  const { data: viewer } = useViewer()
  // Captured once: finishing the wizard flips has_profile, and the "ready" screen must stay.
  const [alreadyHasProfile] = useState(() => viewer?.has_profile ?? false)

  if (!viewer) return <PageLoader />
  if (alreadyHasProfile) return <Navigate to={ROUTES.matches} replace />
  return <Wizard initialDraft={{ ...EMPTY_PROFILE_DRAFT, email: viewer.email }} />
}

/** The same wizard, prefilled, for changing an existing profile. */
export function ProfileEditPage() {
  const navigate = useNavigate()
  const { data: profile, isPending, isError, error } = useMyProfile()

  if (isPending) return <PageLoader />
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>
  if (!profile) return <Navigate to={ROUTES.onboarding} replace />
  return <Wizard initialDraft={toProfileDraft(profile)} onSaved={() => navigate(ROUTES.profile)} />
}
