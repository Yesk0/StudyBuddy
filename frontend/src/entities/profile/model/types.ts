export type StudyFormat = 'in_person' | 'online' | 'either'

export type StudyDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type ProfileDraft = {
  fullName: string
  email: string
  university: string
  yearOfStudy: string
  major: string
  courses: string[]
  studyFormat: StudyFormat
  studyDays: StudyDay[]
}

export type ProfileDto = {
  full_name: string
  email: string
  university: string
  year_of_study: number
  major: string
  courses: string[]
  study_format: StudyFormat
  study_days: StudyDay[]
}

export type Profile = ProfileDto & { id: number }
