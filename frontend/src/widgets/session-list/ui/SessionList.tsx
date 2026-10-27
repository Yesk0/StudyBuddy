import { useState } from 'react'
import { SessionCard, useSessions, type StudySessionListItem } from '@/entities/study-session'
import { useViewer } from '@/entities/viewer'
import { SessionActions } from '@/features/respond-to-session'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  PageLoader,
  Panel,
  SectionLabel,
} from '@/shared/ui'
import styles from './SessionList.module.css'

function SessionItem({ session, viewerId }: { session: StudySessionListItem; viewerId: number }) {
  return (
    <SessionCard
      session={session}
      eyebrow={`With ${session.partner.full_name}`}
      actions={
        <>
          <SessionActions session={session} viewerId={viewerId} />
          <ButtonLink to={ROUTES.chat(session.connection_id)} size="sm" variant="ghost">
            Open chat
          </ButtonLink>
        </>
      }
    />
  )
}

function SessionGroup({
  title,
  sessions,
  viewerId,
}: {
  title: string
  sessions: StudySessionListItem[]
  viewerId: number
}) {
  if (sessions.length === 0) return null
  return (
    <section className={styles.group}>
      <SectionLabel>{title}</SectionLabel>
      <div className={styles.list}>
        {sessions.map((session) => (
          <SessionItem key={session.id} session={session} viewerId={viewerId} />
        ))}
      </div>
    </section>
  )
}

function PastSessions({ viewerId }: { viewerId: number }) {
  const past = useSessions('past')
  if (past.isPending) return <PageLoader />
  if (past.isError) return <Alert tone="error">{errorMessage(past.error)}</Alert>
  if (past.data.length === 0) {
    return (
      <section className={styles.group}>
        <SectionLabel>Past</SectionLabel>
        <p className={styles.muted}>No past sessions yet.</p>
      </section>
    )
  }
  return <SessionGroup title="Past" sessions={past.data} viewerId={viewerId} />
}

export function SessionList() {
  const { data: viewer } = useViewer()
  const viewerId = viewer?.id ?? -1
  const [showPast, setShowPast] = useState(false)
  const upcoming = useSessions('upcoming')

  if (upcoming.isPending) return <PageLoader />
  if (upcoming.isError) return <Alert tone="error">{errorMessage(upcoming.error)}</Alert>

  const sessions = upcoming.data
  const needsAnswer = sessions.filter((s) => s.status === 'proposed' && s.proposer_id !== viewerId)
  const confirmed = sessions.filter((s) => s.status === 'accepted')
  const waiting = sessions.filter((s) => s.status === 'proposed' && s.proposer_id === viewerId)

  return (
    <>
      {sessions.length === 0 ? (
        <Panel>
          <EmptyState
            title="No upcoming sessions"
            text="Open a chat with a study partner and propose a time to study together."
            action={
              <ButtonLink to={ROUTES.chats} variant="secondary">
                Go to chats
              </ButtonLink>
            }
          />
        </Panel>
      ) : (
        <>
          <SessionGroup title="Needs your answer" sessions={needsAnswer} viewerId={viewerId} />
          <SessionGroup title="Confirmed" sessions={confirmed} viewerId={viewerId} />
          <SessionGroup title="Waiting for your partner" sessions={waiting} viewerId={viewerId} />
        </>
      )}

      {showPast ? (
        <PastSessions viewerId={viewerId} />
      ) : (
        <Button className={styles.pastToggle} variant="ghost" size="sm" onClick={() => setShowPast(true)}>
          Show past and cancelled sessions
        </Button>
      )}
    </>
  )
}
