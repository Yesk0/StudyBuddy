import { useState } from 'react'
import { YEAR_OPTIONS, type ProfileDraft } from '@/entities/profile'
import { Divider, FormCard, SectionLabel, SelectField, TextField } from '@/shared/ui'
import { validateBasicInfo, type BasicInfoErrors } from '../model/validateBasicInfo'
import styles from './BasicInfoStep.module.css'

type BasicInfoStepProps = {
  draft: ProfileDraft
  onChange: (patch: Partial<ProfileDraft>) => void
  onNext: () => void
}

export function BasicInfoStep({ draft, onChange, onNext }: BasicInfoStepProps) {
  const [errors, setErrors] = useState<BasicInfoErrors>({})

  const update = (field: keyof BasicInfoErrors, value: string) => {
    onChange({ [field]: value })
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = () => {
    const nextErrors = validateBasicInfo(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onNext()
  }

  return (
    <FormCard
      title="Set up your study profile"
      subtitle="Tell us a little about yourself so we can find good study partners."
      submitLabel="Continue"
      onSubmit={handleSubmit}
    >
      <SectionLabel>Basic information</SectionLabel>
      <div className={styles.row}>
        <TextField
          title="Full name"
          placeholder="Your name"
          autoComplete="name"
          value={draft.fullName}
          error={errors.fullName}
          onChange={(value) => update('fullName', value)}
        />
        <TextField
          title="University email"
          type="email"
          placeholder="name@university.edu"
          autoComplete="email"
          value={draft.email}
          error={errors.email}
          onChange={(value) => update('email', value)}
        />
      </div>
      <div className={`${styles.row} ${styles.rowWide}`}>
        <TextField
          title="University"
          placeholder="Search for your university"
          autoComplete="organization"
          value={draft.university}
          error={errors.university}
          onChange={(value) => update('university', value)}
        />
        <SelectField
          title="Year of study"
          placeholder="Select year"
          options={YEAR_OPTIONS}
          value={draft.yearOfStudy}
          error={errors.yearOfStudy}
          onChange={(value) => update('yearOfStudy', value)}
        />
      </div>
      <Divider />
      <p className={styles.note}>Use your university email to help verify your student profile.</p>
    </FormCard>
  )
}
