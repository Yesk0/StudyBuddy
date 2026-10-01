import type { ProfileDraft } from '@/entities/profile'

type BasicInfoField = 'fullName' | 'email' | 'university' | 'yearOfStudy'

export type BasicInfoErrors = Partial<Record<BasicInfoField, string>>

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function validateBasicInfo(draft: ProfileDraft): BasicInfoErrors {
  const errors: BasicInfoErrors = {}

  if (!draft.fullName.trim()) errors.fullName = 'Enter your name'
  if (!EMAIL_PATTERN.test(draft.email.trim())) errors.email = 'Enter a valid email'
  if (!draft.university.trim()) errors.university = 'Enter your university'
  if (!draft.yearOfStudy) errors.yearOfStudy = 'Select your year'

  return errors
}
