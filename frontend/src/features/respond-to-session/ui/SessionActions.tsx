import { useMutation, useQueryClient } from '@tanstack/react-query'
import { connectionKeys } from '@/entities/connection'
import {
  respondToSession,
  sessionKeys,
  type SessionAction,
  type StudySession,
} from '@/entities/study-session'
import { errorMessage } from '@/shared/api'
import { useNow } from '@/shared/lib'
import { Button } from '@/shared/ui'
import styles from './SessionActions.module.css'

type SessionActionsProps = {
  session: StudySession
  viewerId: number
}

export function SessionActions({ session, viewerId }: SessionActionsProps) {
  const queryClient = useQueryClient()
  const respond = useMutation({
    mutationFn: (action: SessionAction) => respondToSession(session.id, action),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      queryClient.invalidateQueries({ queryKey: connectionKeys.messages(session.connection_id) })
    },
  })

  const now = useNow()
  const started = new Date(session.starts_at).getTime() <= now
  const mine = session.proposer_id === viewerId
  const busy = respond.isPending

  let buttons = null
  if (session.status === 'proposed' && !mine && !started) {
    buttons = (
      <>
        <Button size="sm" disabled={busy} onClick={() => respond.mutate('accept')}>
          Accept
        </Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => respond.mutate('decline')}>
          Decline
        </Button>
      </>
    )
  } else if ((session.status === 'proposed' || session.status === 'accepted') && !started) {
    buttons = (
      <Button size="sm" variant="danger" disabled={busy} onClick={() => respond.mutate('cancel')}>
        {session.status === 'proposed' ? 'Withdraw proposal' : 'Cancel session'}
      </Button>
    )
  }

  if (!buttons) return null
  return (
    <>
      {buttons}
      {respond.isError && (
        <span role="alert" className={styles.error}>
          {errorMessage(respond.error)}
        </span>
      )}
    </>
  )
}
