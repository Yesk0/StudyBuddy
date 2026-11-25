import { useNavigate } from 'react-router'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { Button, ConfirmButton } from '@/shared/ui'
import { useLeaveGroup, useRemoveMember, useRespondToJoin } from '../model/useGroupMembership'
import styles from './GroupControls.module.css'

function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <span role="alert" className={styles.error}>
      {errorMessage(error)}
    </span>
  )
}

/** Accept or decline someone who asked to join (owner only). */
export function JoinRequestActions({ requestId }: { requestId: number }) {
  const respond = useRespondToJoin(requestId)
  return (
    <>
      <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate('accept')}>
        Accept
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={respond.isPending}
        onClick={() => respond.mutate('decline')}
      >
        Decline
      </Button>
      <ErrorText error={respond.error} />
    </>
  )
}

export function RemoveMemberButton({ groupId, userId }: { groupId: number; userId: number }) {
  const remove = useRemoveMember(groupId)
  return (
    <>
      <ConfirmButton confirmLabel="Remove" disabled={remove.isPending} onConfirm={() => remove.mutate(userId)}>
        Remove
      </ConfirmButton>
      <ErrorText error={remove.error} />
    </>
  )
}

export function LeaveGroupButton({ groupId, lastMember }: { groupId: number; lastMember: boolean }) {
  const navigate = useNavigate()
  const leave = useLeaveGroup(groupId)
  return (
    <>
      <ConfirmButton
        confirmLabel={lastMember ? 'Leave and delete group' : 'Leave group'}
        disabled={leave.isPending}
        onConfirm={() => leave.mutate(undefined, { onSuccess: () => navigate(ROUTES.groups) })}
      >
        Leave group
      </ConfirmButton>
      <ErrorText error={leave.error} />
    </>
  )
}
