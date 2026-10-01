import { useRef, useState, type KeyboardEvent } from 'react'
import type { ProfileDraft } from '@/entities/profile'
import { Chip, ChipGroup, Divider, FormCard, InfoBox, SectionLabel, TextField } from '@/shared/ui'
import styles from './StudyDetailsStep.module.css'

type StudyDetailsStepProps = {
  draft: ProfileDraft
  onChange: (patch: Partial<ProfileDraft>) => void
  onNext: () => void
  onBack: () => void
}

type StudyDetailsErrors = { major?: string; courses?: string }

export function StudyDetailsStep({ draft, onChange, onNext, onBack }: StudyDetailsStepProps) {
  const [courseInput, setCourseInput] = useState('')
  const [errors, setErrors] = useState<StudyDetailsErrors>({})
  const courseInputRef = useRef<HTMLInputElement>(null)

  const addCourse = () => {
    const course = courseInput.trim()
    if (!course) {
      courseInputRef.current?.focus()
      return
    }
    if (!draft.courses.some((existing) => existing.toLowerCase() === course.toLowerCase())) {
      onChange({ courses: [...draft.courses, course] })
    }
    setCourseInput('')
    setErrors((current) => ({ ...current, courses: undefined }))
  }

  const removeCourse = (course: string) => {
    onChange({ courses: draft.courses.filter((existing) => existing !== course) })
  }

  const handleCourseKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addCourse()
    }
  }

  const handleSubmit = () => {
    const nextErrors: StudyDetailsErrors = {}
    if (!draft.major.trim()) nextErrors.major = 'Enter your major or program'
    if (draft.courses.length === 0) nextErrors.courses = 'Add at least one course'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onNext()
  }

  return (
    <FormCard
      title="Add your study details"
      subtitle="Choose your program and the courses you are taking this term."
      submitLabel="Continue"
      onSubmit={handleSubmit}
      onBack={onBack}
    >
      <SectionLabel>Your studies</SectionLabel>
      <TextField
        className={styles.field}
        title="Major or program"
        placeholder="e.g. Computer Science"
        value={draft.major}
        error={errors.major}
        onChange={(value) => {
          onChange({ major: value })
          setErrors((current) => ({ ...current, major: undefined }))
        }}
      />
      <TextField
        ref={courseInputRef}
        title="Add a course"
        placeholder="Search courses or enter a course name"
        value={courseInput}
        error={errors.courses}
        onChange={setCourseInput}
        onKeyDown={handleCourseKeyDown}
      />

      <SectionLabel className={styles.coursesLabel}>Your courses</SectionLabel>
      {draft.courses.length > 0 && (
        <ChipGroup>
          {draft.courses.map((course) => (
            <Chip
              key={course}
              selected
              aria-label={`Remove ${course}`}
              onClick={() => removeCourse(course)}
            >
              {course}
            </Chip>
          ))}
        </ChipGroup>
      )}
      <Chip className={draft.courses.length > 0 ? styles.addAnother : undefined} onClick={addCourse}>
        + Add another
      </Chip>

      <Divider />
      <InfoBox title="Why add courses?">
        Shared classes help us find students studying the same topics.
      </InfoBox>
    </FormCard>
  )
}
