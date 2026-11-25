import type { StudySession } from '@/entities/study-session'
import { errorMessage } from '@/shared/api'
import { useNow } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { useRespondToSession } from '../model/useRespondToSession'
import styles from './SessionActions.module.css'

type SessionActionsProps = {
  session: StudySession
  viewerId: number
  /** For group sessions: the owner may cancel any session of the group. */
  groupOwnerId?: number
}

export function SessionActions({ session, viewerId, groupOwnerId }: SessionActionsProps) {
  const respond = useRespondToSession(session)

  const now = useNow()
  const started = new Date(session.starts_at).getTime() <= now
  const mine = session.proposer_id === viewerId
  const isGroup = session.group_id !== null
  const active = session.status === 'proposed' || session.status === 'accepted'
  const canCancel = isGroup ? mine || groupOwnerId === viewerId : true
  const busy = respond.isPending

  let buttons = null
  if (!isGroup && session.status === 'proposed' && !mine && !started) {
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
  } else if (active && !started && canCancel) {
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
