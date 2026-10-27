import { useState } from 'react'
import type { ProfileDraft } from '@/entities/profile'
import { useSaveProfile } from '@/features/save-profile'

export const TOTAL_STEPS = 3

export type WizardStep = 'basic-info' | 'study-details' | 'preferences' | 'ready'

const STEP_NUMBER: Record<WizardStep, number> = {
  'basic-info': 1,
  'study-details': 2,
  preferences: 3,
  ready: 3,
}

type Options = {
  initialDraft: ProfileDraft
  /** Called after a successful save. Without it the wizard shows the "profile is ready" screen. */
  onSaved?: () => void
}

export function useProfileSetupWizard({ initialDraft, onSaved }: Options) {
  const [step, setStep] = useState<WizardStep>('basic-info')
  const [draft, setDraft] = useState<ProfileDraft>(initialDraft)
  const { save, saving, error } = useSaveProfile()

  const updateDraft = (patch: Partial<ProfileDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const finish = async () => {
    if (!(await save(draft))) return
    if (onSaved) onSaved()
    else setStep('ready')
  }

  return {
    step,
    stepNumber: STEP_NUMBER[step],
    draft,
    saving,
    error,
    updateDraft,
    goTo: setStep,
    finish,
  }
}

export type ProfileSetupWizardModel = ReturnType<typeof useProfileSetupWizard>
