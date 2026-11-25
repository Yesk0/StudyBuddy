import { useState, type FormEvent } from 'react'
import type { ForumPostDetail } from '@/entities/forum-post'
import { errorMessage } from '@/shared/api'
import { Button, Chip, ChipGroup, TextArea, TextField } from '@/shared/ui'
import { useCreatePost } from '../model/useCreatePost'
import styles from './CreatePostForm.module.css'

type CreatePostFormProps = {
  myCourses: string[]
  onCreated: (post: ForumPostDetail) => void
  onCancel: () => void
}

type Errors = { title?: string; body?: string }

export function CreatePostForm({ myCourses, onCreated, onCancel }: CreatePostFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [course, setCourse] = useState<string | null>(myCourses[0] ?? null)
  const [errors, setErrors] = useState<Errors>({})

  const create = useCreatePost()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next: Errors = {}
    if (title.trim().length < 3) next.title = 'Use at least 3 characters'
    if (!body.trim()) next.body = 'Say a few words about what you are looking for'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    create.mutate({ title: title.trim(), body: body.trim(), course }, { onSuccess: onCreated })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>New post</h2>
      <TextField
        title="Title"
        placeholder="e.g. Looking for someone to prepare for the Database midterm"
        maxLength={120}
        value={title}
        error={errors.title}
        onChange={(value) => {
          setTitle(value)
          setErrors((current) => ({ ...current, title: undefined }))
        }}
      />
      {myCourses.length > 0 && (
        <div>
          <p className={styles.label}>Course</p>
          <ChipGroup>
            {myCourses.map((name) => (
              <Chip key={name} selected={course === name} aria-pressed={course === name} onClick={() => setCourse(name)}>
                {name}
              </Chip>
            ))}
            <Chip selected={course === null} aria-pressed={course === null} onClick={() => setCourse(null)}>
              General
            </Chip>
          </ChipGroup>
        </div>
      )}
      <TextArea
        title="Details"
        placeholder="When are you free, what do you want to cover, in person or online…"
        maxLength={4000}
        rows={5}
        value={body}
        error={errors.body}
        onChange={(value) => {
          setBody(value)
          setErrors((current) => ({ ...current, body: undefined }))
        }}
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
          {create.isPending ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </form>
  )
}
