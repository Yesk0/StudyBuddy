import type { ProfileDraft, ProfileDto } from '../model/types'

export function toProfileDto(draft: ProfileDraft): ProfileDto {
  return {
    full_name: draft.fullName.trim(),
    email: draft.email.trim(),
    university: draft.university.trim(),
    year_of_study: Number(draft.yearOfStudy),
    major: draft.major.trim(),
    courses: draft.courses,
    study_format: draft.studyFormat,
    study_days: draft.studyDays,
  }
}
