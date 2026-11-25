import { useState, type FormEvent } from 'react'
import type { Group } from '@/entities/group'
import { errorMessage } from '@/shared/api'
import { Button, Tag, TextArea } from '@/shared/ui'
import { useCancelJoinRequest, useJoinGroup } from '../model/useJoinGroup'
import styles from './JoinGroupPanel.module.css'

/** Join request controls for someone who is not in the group yet. */
export function JoinGroupPanel({ group }: { group: Group }) {
  const [composing, setComposing] = useState(false)
  const [message, setMessage] = useState('')
  const join = useJoinGroup(group.id)
  const cancel = useCancelJoinRequest()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    join.mutate(message.trim(), { onSuccess: () => setComposing(false) })
  }

  const error = join.error ?? cancel.error
  const errorText = error && (
    <span role="alert" className={styles.error}>
      {errorMessage(error)}
    </span>
  )

  if (group.is_member) return <Tag tone="success">You are in this group</Tag>

  const request = group.my_request
  if (request?.status === 'pending') {
    return (
      <>
        <Tag tone="warning">Request sent</Tag>
        <Button
          size="sm"
          variant="secondary"
          disabled={cancel.isPending}
          onClick={() => cancel.mutate(request.id)}
        >
          Cancel request
        </Button>
        {errorText}
      </>
    )
  }
  if (request?.status === 'declined') return <Tag tone="muted">Request declined</Tag>
  if (group.member_count >= group.max_members) return <Tag tone="muted">Group is full</Tag>

  if (!composing) {
    return (
      <Button size="sm" onClick={() => setComposing(true)}>
        Ask to join
      </Button>
    )
  }
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextArea
        title="Message to the organiser (optional)"
        placeholder="Hi! I'm preparing for the same exam and free on these days."
        maxLength={300}
        rows={2}
        value={message}
        onChange={setMessage}
      />
      {errorText}
      <div className={styles.actions}>
        <Button variant="ghost" size="md" onClick={() => setComposing(false)}>
          Cancel
        </Button>
        <Button type="submit" size="md" disabled={join.isPending}>
          {join.isPending ? 'Sending…' : 'Send request'}
        </Button>
      </div>
    </form>
  )
}
