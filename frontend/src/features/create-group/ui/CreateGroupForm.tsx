import { useId, useState, type FormEvent } from 'react'
import { useCourseSearch } from '@/entities/course'
import type { GroupDetail } from '@/entities/group'
import { errorMessage } from '@/shared/api'
import { Button, Chip, ChipGroup, TextArea, TextField } from '@/shared/ui'
import { useCreateGroup } from '../model/useCreateGroup'
import styles from './CreateGroupForm.module.css'

type CreateGroupFormProps = {
  /** Courses suggested first, usually the viewer's own. */
  myCourses: string[]
  defaultCourse?: string
  onCreated: (group: GroupDetail) => void
  onCancel: () => void
}

type Errors = { name?: string; course?: string }

export function CreateGroupForm({ myCourses, defaultCourse, onCreated, onCancel }: CreateGroupFormProps) {
  const [course, setCourse] = useState(defaultCourse ?? myCourses[0] ?? '')
  const [name, setName] = useState(course ? `${course} study group` : '')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState(4)
  const [errors, setErrors] = useState<Errors>({})
  const suggestionsId = useId()
  const { data: suggestions = [] } = useCourseSearch(course)

  const create = useCreateGroup()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next: Errors = {}
    if (name.trim().length < 3) next.name = 'Use at least 3 characters'
    if (!course.trim()) next.course = 'Choose a course'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    create.mutate(
      {
        name: name.trim(),
        course: course.trim(),
        description: description.trim(),
        max_members: size,
      },
      { onSuccess: onCreated },
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Create a study group</h2>
      <div className={styles.row}>
        <TextField
          title="Course"
          placeholder="e.g. Databases"
          list={suggestionsId}
          autoComplete="off"
          maxLength={120}
          value={course}
          error={errors.course}
          onChange={(value) => {
            setCourse(value)
            setErrors((current) => ({ ...current, course: undefined }))
          }}
        />
        <TextField
          title="Group name"
          placeholder="e.g. Databases midterm squad"
          maxLength={80}
          value={name}
          error={errors.name}
          onChange={(value) => {
            setName(value)
            setErrors((current) => ({ ...current, name: undefined }))
          }}
        />
      </div>
      <datalist id={suggestionsId}>
        {[...new Set([...myCourses, ...suggestions.map((s) => s.name)])].map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <div>
        <p className={styles.label}>Group size</p>
        <ChipGroup>
          {[3, 4].map((value) => (
            <Chip key={value} selected={size === value} aria-pressed={size === value} onClick={() => setSize(value)}>
              {value} students
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <TextArea
        title="What is the plan? (optional)"
        placeholder="e.g. Solving past midterms every Wednesday evening in the library."
        maxLength={500}
        rows={3}
        value={description}
        onChange={setDescription}
      />
      {create.isError && (
        <p className={styles.error} role="alert">
          {errorMessage(create.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="md" disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create group'}
        </Button>
      </div>
    </form>
  )
}
