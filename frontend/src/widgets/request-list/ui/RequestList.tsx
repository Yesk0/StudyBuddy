import { useState } from 'react'
import {
  RequestCard,
  usePendingIncomingCount,
  useRequests,
  type RequestBox,
  type StudyRequest,
} from '@/entities/study-request'
import { RequestActions } from '@/features/respond-to-request'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import {
  Alert,
  Badge,
  ButtonLink,
  Chip,
  ChipGroup,
  EmptyState,
  PageLoader,
  Panel,
  SectionLabel,
} from '@/shared/ui'
import styles from './RequestList.module.css'

function RequestItem({ request, box }: { request: StudyRequest; box: RequestBox }) {
  const student = box === 'incoming' ? request.sender : request.receiver
  let actions = null
  if (request.status === 'pending') {
    actions = <RequestActions requestId={request.id} direction={box} />
  } else if (request.status === 'accepted' && request.connection_id) {
    actions = (
      <ButtonLink to={ROUTES.chat(request.connection_id)} size="sm" variant="secondary">
        Open chat
      </ButtonLink>
    )
  }
  return <RequestCard request={request} student={student} actions={actions} />
}

const EMPTY: Record<RequestBox, { title: string; text: string }> = {
  incoming: {
    title: 'No requests yet',
    text: 'When a classmate wants to study with you, their request will show up here.',
  },
  outgoing: {
    title: 'You have not sent any requests',
    text: 'Find students who take the same courses and send them a study request.',
  },
}

export function RequestList() {
  const [box, setBox] = useState<RequestBox>('incoming')
  const pendingIncoming = usePendingIncomingCount()
  const { data: requests, isPending, isError, error } = useRequests(box)

  const pending = requests?.filter((request) => request.status === 'pending') ?? []
  const history = requests?.filter((request) => request.status !== 'pending') ?? []

  return (
    <>
      <ChipGroup className={styles.tabs} role="tablist">
        <Chip role="tab" aria-selected={box === 'incoming'} selected={box === 'incoming'} onClick={() => setBox('incoming')}>
          <span className={styles.tabLabel}>
            Received <Badge count={pendingIncoming} />
          </span>
        </Chip>
        <Chip role="tab" aria-selected={box === 'outgoing'} selected={box === 'outgoing'} onClick={() => setBox('outgoing')}>
          Sent
        </Chip>
      </ChipGroup>

      {isPending && <PageLoader />}
      {isError && <Alert tone="error">{errorMessage(error)}</Alert>}
      {requests && requests.length === 0 && (
        <Panel>
          <EmptyState
            {...EMPTY[box]}
            action={
              box === 'outgoing' && (
                <ButtonLink to={ROUTES.matches} variant="secondary">
                  Find study partners
                </ButtonLink>
              )
            }
          />
        </Panel>
      )}
      {pending.length > 0 && (
        <section className={styles.group}>
          <SectionLabel>{box === 'incoming' ? 'Waiting for your answer' : 'Waiting for an answer'}</SectionLabel>
          <div className={styles.list}>
            {pending.map((request) => (
              <RequestItem key={request.id} request={request} box={box} />
            ))}
          </div>
        </section>
      )}
      {history.length > 0 && (
        <section className={styles.group}>
          <SectionLabel>History</SectionLabel>
          <div className={styles.list}>
            {history.map((request) => (
              <RequestItem key={request.id} request={request} box={box} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
