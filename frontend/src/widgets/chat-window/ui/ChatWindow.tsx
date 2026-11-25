import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MessageList, useConnection, useThreadMessages, type Thread } from '@/entities/connection'
import { yearLabel } from '@/entities/profile'
import { SessionCard } from '@/entities/study-session'
import { useViewer } from '@/entities/viewer'
import { AddToCalendarButton } from '@/features/export-session-ics'
import { ProposeSessionForm } from '@/features/propose-session'
import { SessionActions } from '@/features/respond-to-session'
import { MessageComposer } from '@/features/send-message'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { Alert, Avatar, BackButton, Button, PageLoader, Tag, TagList } from '@/shared/ui'
import styles from './ChatWindow.module.css'

export function ChatWindow({ connectionId }: { connectionId: number }) {
  const navigate = useNavigate()
  const thread: Thread = { kind: 'connection', id: connectionId }
  const { data: viewer } = useViewer()
  const connection = useConnection(connectionId)
  const messages = useThreadMessages(thread)
  const [proposing, setProposing] = useState(false)

  if (connection.isPending || messages.isPending) return <PageLoader />
  if (connection.isError) return <Alert tone="error">{errorMessage(connection.error)}</Alert>
  if (messages.isError) return <Alert tone="error">{errorMessage(messages.error)}</Alert>

  const { partner, shared_courses: sharedCourses } = connection.data
  const viewerId = viewer?.id ?? -1

  return (
    <section className={styles.window}>
      <header className={styles.header}>
        <span className={styles.back}>
          <BackButton label="Chats" onClick={() => navigate(ROUTES.chats)} />
        </span>
        <Avatar name={partner.full_name} size={44} />
        <div className={styles.identity}>
          <h2 className={styles.name}>{partner.full_name}</h2>
          <p className={styles.meta}>
            {[yearLabel(partner.year_of_study), partner.major, partner.university]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {sharedCourses.length > 0 && (
          <TagList>
            {sharedCourses.map((course) => (
              <Tag key={course} tone="selected">
                {course}
              </Tag>
            ))}
          </TagList>
        )}
      </header>

      <MessageList
        messages={messages.data.messages}
        hasMore={messages.data.hasMore}
        loadingEarlier={messages.loadingEarlier}
        onLoadEarlier={messages.loadEarlier}
        viewerId={viewerId}
        emptyText={`You are now study partners with ${partner.full_name}. Say hi and agree on a time to study together.`}
        renderSession={(message, mine) => (
          <SessionCard
            className={styles.session}
            session={message.session!}
            eyebrow={mine ? 'You proposed a session' : `${partner.full_name} proposed a session`}
            actions={
              <>
                <SessionActions session={message.session!} viewerId={viewerId} />
                <AddToCalendarButton session={message.session!} withWhom={partner.full_name} />
              </>
            }
          />
        )}
      />

      <div className={styles.bottom}>
        {proposing ? (
          <ProposeSessionForm
            thread={thread}
            defaultTitle={sharedCourses[0] ? `${sharedCourses[0]} study session` : ''}
            onDone={() => setProposing(false)}
          />
        ) : (
          <div>
            <Button variant="secondary" size="sm" onClick={() => setProposing(true)}>
              Propose a study session
            </Button>
          </div>
        )}
        <MessageComposer thread={thread} />
      </div>
    </section>
  )
}
