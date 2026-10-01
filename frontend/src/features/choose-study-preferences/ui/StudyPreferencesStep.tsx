import { useState } from 'react'
import {
  STUDY_DAY_OPTIONS,
  STUDY_FORMAT_OPTIONS,
  type ProfileDraft,
  type StudyDay,
} from '@/entities/profile'
import { Chip, ChipGroup, Divider, FormCard, InfoBox, SectionLabel } from '@/shared/ui'
import styles from './StudyPreferencesStep.module.css'

type StudyPreferencesStepProps = {
  draft: ProfileDraft
  submitting: boolean
  error: string | null
  onChange: (patch: Partial<ProfileDraft>) => void
  onSubmit: () => void
  onBack: () => void
}

export function StudyPreferencesStep({
  draft,
  submitting,
  error,
  onChange,
  onSubmit,
  onBack,
}: StudyPreferencesStepProps) {
  const [daysError, setDaysError] = useState<string | null>(null)

  const toggleDay = (day: StudyDay) => {
    const studyDays = draft.studyDays.includes(day)
      ? draft.studyDays.filter((selected) => selected !== day)
      : STUDY_DAY_OPTIONS.map(({ value }) => value).filter(
          (value) => value === day || draft.studyDays.includes(value),
        )
    onChange({ studyDays })
    setDaysError(null)
  }

  const handleSubmit = () => {
    if (draft.studyDays.length === 0) {
      setDaysError('Choose at least one day to study')
      return
    }
    onSubmit()
  }

  return (
    <FormCard
      title="Choose your study preferences"
      subtitle="Set your preferred format and days to meet."
      submitLabel="Finish profile"
      onSubmit={handleSubmit}
      onBack={onBack}
      submitting={submitting}
      error={daysError ?? error}
    >
      <SectionLabel className={styles.sectionLabel}>Study preferences</SectionLabel>

      <div className={styles.group} role="radiogroup" aria-labelledby="study-format-title">
        <p id="study-format-title" className={styles.groupTitle}>
          I prefer to study
        </p>
        <ChipGroup>
          {STUDY_FORMAT_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="radio"
              aria-checked={draft.studyFormat === option.value}
              selected={draft.studyFormat === option.value}
              onClick={() => onChange({ studyFormat: option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      <div role="group" aria-labelledby="study-days-title">
        <p id="study-days-title" className={styles.groupTitle}>
          Best days to study
        </p>
        <ChipGroup className={styles.days}>
          {STUDY_DAY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              compact
              aria-pressed={draft.studyDays.includes(option.value)}
              selected={draft.studyDays.includes(option.value)}
              onClick={() => toggleDay(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      <Divider className={styles.divider} />
      <InfoBox className={styles.note}>You can change these preferences at any time.</InfoBox>
    </FormCard>
  )
}
