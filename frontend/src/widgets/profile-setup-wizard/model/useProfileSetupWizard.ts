import { useState } from 'react'
import { EMPTY_PROFILE_DRAFT, type ProfileDraft } from '@/entities/profile'
import { useSaveProfile } from '@/features/save-profile'

export const TOTAL_STEPS = 3

export type WizardStep = 'basic-info' | 'study-details' | 'preferences' | 'ready'

const STEP_NUMBER: Record<WizardStep, number> = {
  'basic-info': 1,
  'study-details': 2,
  preferences: 3,
  ready: 3,
}

export function useProfileSetupWizard() {
  const [step, setStep] = useState<WizardStep>('basic-info')
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_PROFILE_DRAFT)
  const { save, saving, error } = useSaveProfile()

  const updateDraft = (patch: Partial<ProfileDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const finish = async () => {
    if (await save(draft)) setStep('ready')
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
