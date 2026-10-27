import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { appendMessageToCache, connectionKeys, sendMessage } from '@/entities/connection'
import { errorMessage } from '@/shared/api'
import { Button } from '@/shared/ui'
import styles from './MessageComposer.module.css'

const MAX_LENGTH = 2000

export function MessageComposer({ connectionId }: { connectionId: number }) {
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const send = useMutation({
    mutationFn: (text: string) => sendMessage(connectionId, text),
    onSuccess: (message) => {
      appendMessageToCache(queryClient, message)
      queryClient.invalidateQueries({ queryKey: connectionKeys.list })
    },
    onError: (_error, text) => setBody(text),
  })

  const submit = () => {
    const text = body.trim()
    if (!text || send.isPending) return
    setBody('')
    send.mutate(text)
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
