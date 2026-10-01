import { StudyDetailsStep } from '@/features/add-study-details'
import { StudyPreferencesStep } from '@/features/choose-study-preferences'
import { BasicInfoStep } from '@/features/fill-basic-info'
import type { ProfileSetupWizardModel } from '../model/useProfileSetupWizard'
import { ProfileReady } from './ProfileReady'

type ProfileSetupWizardProps = {
  wizard: ProfileSetupWizardModel
}

export function ProfileSetupWizard({ wizard }: ProfileSetupWizardProps) {
  const { step, draft, saving, error, updateDraft, goTo, finish } = wizard

  switch (step) {
    case 'basic-info':
      return <BasicInfoStep draft={draft} onChange={updateDraft} onNext={() => goTo('study-details')} />
    case 'study-details':
      return (
        <StudyDetailsStep
          draft={draft}
          onChange={updateDraft}
          onNext={() => goTo('preferences')}
          onBack={() => goTo('basic-info')}
        />
      )
    case 'preferences':
      return (
        <StudyPreferencesStep
          draft={draft}
          submitting={saving}
          error={error}
          onChange={updateDraft}
          onSubmit={finish}
          onBack={() => goTo('study-details')}
        />
      )
    case 'ready':
      return <ProfileReady onEdit={() => goTo('basic-info')} />
  }
}
