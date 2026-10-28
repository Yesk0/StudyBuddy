import type { Profile, ProfileDraft, ProfileDto } from '../model/types'

export function toProfileDto(draft: ProfileDraft): ProfileDto {
  return {
    full_name: draft.fullName.trim(),
    university: draft.university.trim(),
    year_of_study: Number(draft.yearOfStudy),
    major: draft.major.trim(),
    courses: draft.courses,
    study_format: draft.studyFormat,
    study_days: draft.studyDays,
  }
}

export function toProfileDraft(profile: Profile): ProfileDraft {
  return {
    fullName: profile.full_name,
    email: profile.email,
    university: profile.university,
    yearOfStudy: String(profile.year_of_study),
    major: profile.major,
    courses: profile.courses,
    studyFormat: profile.study_format,
    studyDays: profile.study_days,
  }
}
