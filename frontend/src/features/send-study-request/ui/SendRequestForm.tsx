import { useState, type FormEvent } from 'react'
import { errorMessage } from '@/shared/api'
import { Button, Chip, ChipGroup, TextArea } from '@/shared/ui'
import { useSendStudyRequest } from '../model/useSendStudyRequest'
import styles from './SendRequestForm.module.css'

const MAX_MESSAGE_LENGTH = 300

type SendRequestFormProps = {
  receiverId: number
  /** Courses to choose from; the first one is preselected. */
  courses: string[]
  onClose: () => void
  onSent?: () => void
}

export function SendRequestForm({ receiverId, courses, onClose, onSent }: SendRequestFormProps) {
  const [course, setCourse] = useState<string | null>(courses[0] ?? null)
  const [message, setMessage] = useState('')

  const send = useSendStudyRequest()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    send.mutate(
      { receiver_id: receiverId, course, message: message.trim() },
      {
        onSuccess: () => {
          onSent?.()
          onClose()
        },
      },
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {courses.length > 1 && (
        <div>
          <p className={styles.label}>Which course do you want to study?</p>
          <ChipGroup>
            {courses.map((name) => (
              <Chip
                key={name}
                selected={course === name}
                aria-pressed={course === name}
                onClick={() => setCourse(name)}
              >
                {name}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      )}
      <TextArea
        title="Message (optional)"
        placeholder={`Hi! Want to prepare for ${course ?? 'the midterm'} together?`}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={3}
        value={message}
        supportingText={`${message.length}/${MAX_MESSAGE_LENGTH}`}
        onChange={setMessage}
      />
      {send.isError && (
        <p className={styles.error} role="alert">
          {errorMessage(send.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="ghost" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="md" disabled={send.isPending}>
          {send.isPending ? 'Sending…' : 'Send request'}
        </Button>
      </div>
    </form>
  )
}
