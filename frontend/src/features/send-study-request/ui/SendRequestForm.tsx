import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { matchKeys, type MatchCandidate } from '@/entities/match'
import { createRequest, requestKeys } from '@/entities/study-request'
import { errorMessage } from '@/shared/api'
import { Button, Chip, ChipGroup, TextArea } from '@/shared/ui'
import styles from './SendRequestForm.module.css'

const MAX_MESSAGE_LENGTH = 300

type SendRequestFormProps = {
  match: MatchCandidate
  onClose: () => void
}

export function SendRequestForm({ match, onClose }: SendRequestFormProps) {
  const queryClient = useQueryClient()
  const [course, setCourse] = useState<string | null>(match.shared_courses[0] ?? null)
  const [message, setMessage] = useState('')

  const send = useMutation({
    mutationFn: () =>
      createRequest({ receiver_id: match.user_id, course, message: message.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
      onClose()
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    send.mutate()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {match.shared_courses.length > 1 && (
        <div>
          <p className={styles.label}>Which course do you want to study?</p>
          <ChipGroup>
            {match.shared_courses.map((name) => (
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
