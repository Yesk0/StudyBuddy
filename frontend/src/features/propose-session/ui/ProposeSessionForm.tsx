import { useState, type FormEvent } from 'react'
import type { Thread } from '@/entities/connection'
import type { SessionFormat } from '@/entities/study-session'
import { errorMessage } from '@/shared/api'
import { TIME, toDateTimeLocalValue } from '@/shared/lib'
import { Button, Chip, ChipGroup, SelectField, TextField } from '@/shared/ui'
import { useProposeSession } from '../model/useProposeSession'
import styles from './ProposeSessionForm.module.css'

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: '180', label: '3 hours' },
]

const FORMAT_OPTIONS: { value: SessionFormat; label: string }[] = [
  { value: 'in_person', label: 'In person' },
  { value: 'online', label: 'Online' },
]

function tomorrowAtSix(): string {
  const date = new Date(Date.now() + TIME.DAY)
  date.setHours(18, 0, 0, 0)
  return toDateTimeLocalValue(date)
}

type Errors = { title?: string; startsAt?: string }

type ProposeSessionFormProps = {
  /** The pair chat or group the session is planned in. */
  thread: Thread
  defaultTitle: string
  onDone: () => void
}

export function ProposeSessionForm({ thread, defaultTitle, onDone }: ProposeSessionFormProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [startsAt, setStartsAt] = useState(tomorrowAtSix)
  const [duration, setDuration] = useState('90')
  const [format, setFormat] = useState<SessionFormat>('in_person')
  const [location, setLocation] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  const propose = useProposeSession(thread)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next: Errors = {}
    if (!title.trim()) next.title = 'Add a short title'
    if (!startsAt || new Date(startsAt).getTime() <= Date.now()) next.startsAt = 'Pick a time in the future'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    propose.mutate(
      {
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        duration_minutes: Number(duration),
        format,
        location: location.trim(),
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.heading}>
        {thread.kind === 'group' ? 'Schedule a group session' : 'Propose a study session'}
      </h3>
      <TextField
        title="What will you study?"
        placeholder="e.g. Databases midterm prep"
        maxLength={120}
        value={title}
        error={errors.title}
        onChange={(value) => {
          setTitle(value)
          setErrors((current) => ({ ...current, title: undefined }))
        }}
      />
      <div className={styles.row}>
        <TextField
          title="Date and time"
          type="datetime-local"
          min={toDateTimeLocalValue(new Date())}
          value={startsAt}
          error={errors.startsAt}
          onChange={(value) => {
            setStartsAt(value)
            setErrors((current) => ({ ...current, startsAt: undefined }))
          }}
        />
        <SelectField
          title="Duration"
          placeholder="Duration"
          options={DURATION_OPTIONS}
          value={duration}
          onChange={setDuration}
        />
      </div>
      <div>
        <p className={styles.label}>Format</p>
        <ChipGroup>
          {FORMAT_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              selected={format === option.value}
              aria-pressed={format === option.value}
              onClick={() => setFormat(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <TextField
        title={format === 'online' ? 'Meeting link (optional)' : 'Place (optional)'}
        placeholder={format === 'online' ? 'https://meet.google.com/…' : 'e.g. Library, room 204'}
        maxLength={200}
        value={location}
        onChange={setLocation}
      />
      {propose.isError && (
        <p className={styles.error} role="alert">
          {errorMessage(propose.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="ghost" size="md" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="md" disabled={propose.isPending}>
          {propose.isPending ? 'Sending…' : thread.kind === 'group' ? 'Schedule' : 'Send proposal'}
        </Button>
      </div>
    </form>
  )
}
