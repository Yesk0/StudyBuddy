import type { ProfileDraft, StudyDay, StudyFormat } from './types'

export const YEAR_OPTIONS = [
  { value: '1', label: '1st year' },
  { value: '2', label: '2nd year' },
  { value: '3', label: '3rd year' },
  { value: '4', label: '4th year' },
  { value: '5', label: '5th year+' },
]

export const STUDY_FORMAT_OPTIONS: { value: StudyFormat; label: string }[] = [
  { value: 'in_person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'either', label: 'Either' },
]

export const STUDY_DAY_OPTIONS: { value: StudyDay; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
]

export const EMPTY_PROFILE_DRAFT: ProfileDraft = {
  fullName: '',
  email: '',
  university: '',
  yearOfStudy: '',
  major: '',
  courses: [],
  studyFormat: 'either',
  studyDays: ['mon', 'wed', 'fri'],
}

export function yearLabel(year: number): string {
  return YEAR_OPTIONS.find((option) => option.value === String(year))?.label ?? `Year ${year}`
}

export function studyFormatLabel(format: StudyFormat): string {
  return STUDY_FORMAT_OPTIONS.find((option) => option.value === format)?.label ?? format
}

export function studyDayLabel(day: StudyDay): string {
  return STUDY_DAY_OPTIONS.find((option) => option.value === day)?.label ?? day
}
