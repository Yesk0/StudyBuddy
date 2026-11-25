import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Thread } from '@/entities/connection'
import { errorMessage } from '@/shared/api'
import { Button } from '@/shared/ui'
import { useSendMessage } from '../model/useSendMessage'
import styles from './MessageComposer.module.css'

const MAX_LENGTH = 2000

export function MessageComposer({ thread }: { thread: Thread }) {
  const [body, setBody] = useState('')
  const send = useSendMessage(thread)

  const submit = () => {
    const text = body.trim()
    if (!text || send.isPending) return
    setBody('')
    // Clear right away; put the text back if sending fails.
    send.mutate(text, { onError: () => setBody(text) })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.composer}>
        <textarea
          className={styles.input}
          aria-label="Message"
          placeholder="Write a message…"
          rows={Math.min(5, body.split('\n').length)}
          maxLength={MAX_LENGTH}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button type="submit" size="md" disabled={!body.trim() || send.isPending}>
          Send
        </Button>
      </div>
      {send.isError && (
        <p className={styles.error} role="alert">
          {errorMessage(send.error)}
        </p>
      )}
    </form>
  )
}
