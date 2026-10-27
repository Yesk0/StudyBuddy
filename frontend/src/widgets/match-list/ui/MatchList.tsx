import { useState } from 'react'
import { MatchCard, useMatches, type MatchCandidate } from '@/entities/match'
import { useMyProfile } from '@/entities/profile'
import { RequestActions } from '@/features/respond-to-request'
import { SendRequestForm } from '@/features/send-study-request'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import {
  Alert,
  Button,
  ButtonLink,
  Chip,
  ChipGroup,
  EmptyState,
  PageLoader,
  Panel,
  Tag,
} from '@/shared/ui'
import styles from './MatchList.module.css'

function MatchFooter({
  match,
  composing,
  onCompose,
}: {
  match: MatchCandidate
  composing: boolean
  onCompose: () => void
}) {
  switch (match.status) {
    case 'connected':
      return (
        <>
          <span className={styles.status}>You are study partners</span>
          <ButtonLink to={ROUTES.chat(match.connection_id!)} size="sm">
            Open chat
          </ButtonLink>
        </>
      )
    case 'outgoing':
      return (
        <>
          <Tag tone="warning">Request sent</Tag>
          <RequestActions requestId={match.request_id!} direction="outgoing" />
        </>
      )
    case 'incoming':
      return (
        <>
          <span className={styles.status}>Sent you a study request</span>
          <RequestActions requestId={match.request_id!} direction="incoming" />
        </>
      )
    case 'declined':
      return <Tag tone="muted">Request declined</Tag>
    default:
      return composing ? null : (
        <Button size="sm" onClick={onCompose}>
          Send study request
        </Button>
      )
  }
}

export function MatchList() {
  const [course, setCourse] = useState<string | null>(null)
  const [composingFor, setComposingFor] = useState<number | null>(null)
  const { data: profile } = useMyProfile()
  const { data: matches, isPending, isError, error } = useMatches(course)

  return (
    <>
      {profile && profile.courses.length > 1 && (
        <ChipGroup className={styles.filters} aria-label="Filter by course">
          <Chip selected={course === null} aria-pressed={course === null} onClick={() => setCourse(null)}>
            All my courses
          </Chip>
          {profile.courses.map((name) => (
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
      )}

      {isPending && <PageLoader />}
      {isError && <Alert tone="error">{errorMessage(error)}</Alert>}
      {matches && matches.length === 0 && (
        <Panel>
          <EmptyState
            title="No study partners yet"
            text="Nobody else has added your courses so far. Share StudyBuddy with classmates, or add more courses to your profile."
            action={
              <ButtonLink to={ROUTES.profileEdit} variant="secondary">
                Edit my courses
              </ButtonLink>
            }
          />
        </Panel>
      )}
      {matches && matches.length > 0 && (
        <div className={styles.list}>
          {matches.map((match) => (
            <MatchCard
              key={match.user_id}
              match={match}
              footer={
                <>
                  <MatchFooter
                    match={match}
                    composing={composingFor === match.user_id}
                    onCompose={() => setComposingFor(match.user_id)}
                  />
                  {composingFor === match.user_id && match.status === 'none' && (
                    <SendRequestForm match={match} onClose={() => setComposingFor(null)} />
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
