import { useNavigate } from 'react-router'
import type { RequestAction } from '@/entities/study-request'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { Button } from '@/shared/ui'
import { useRespondToRequest } from '../model/useRespondToRequest'
import styles from './RequestActions.module.css'

type RequestActionsProps = {
  requestId: number
  /** Incoming requests can be accepted or declined; outgoing ones can be cancelled. */
  direction: 'incoming' | 'outgoing'
}

export function RequestActions({ requestId, direction }: RequestActionsProps) {
  const navigate = useNavigate()
  const respond = useRespondToRequest()

  const run = (action: RequestAction) =>
    respond.mutate(
      { requestId, action },
      {
        onSuccess: (request) => {
          if (action === 'accept' && request.connection_id) {
            navigate(ROUTES.chat(request.connection_id))
          }
        },
      },
    )

  return (
    <>
      {direction === 'incoming' ? (
        <>
          <Button size="sm" disabled={respond.isPending} onClick={() => run('accept')}>
            Accept
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={respond.isPending}
            onClick={() => run('decline')}
          >
            Decline
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          disabled={respond.isPending}
          onClick={() => run('cancel')}
        >
          Cancel request
        </Button>
      )}
      {respond.isError && (
        <span role="alert" className={styles.error}>
          {errorMessage(respond.error)}
        </span>
      )}
    </>
  )
}
