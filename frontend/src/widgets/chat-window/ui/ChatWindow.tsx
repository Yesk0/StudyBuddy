import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { MessageBubble, useConnection, useMessages, type Message } from '@/entities/connection'
import { yearLabel } from '@/entities/profile'
import { SessionCard } from '@/entities/study-session'
import { useViewer } from '@/entities/viewer'
import { ProposeSessionForm } from '@/features/propose-session'
import { SessionActions } from '@/features/respond-to-session'
import { MessageComposer } from '@/features/send-message'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { cx, formatDate, isSameDay } from '@/shared/lib'
import { Alert, Avatar, BackButton, Button, PageLoader, Tag, TagList } from '@/shared/ui'
import styles from './ChatWindow.module.css'

function startsNewDay(messages: Message[], index: number): boolean {
  if (index === 0) return true
  return !isSameDay(new Date(messages[index - 1].created_at), new Date(messages[index].created_at))
}

export function ChatWindow({ connectionId }: { connectionId: number }) {
  const navigate = useNavigate()
  const { data: viewer } = useViewer()
  const connection = useConnection(connectionId)
  const messages = useMessages(connectionId)
  const [proposing, setProposing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messageCount = messages.data?.length ?? 0
  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messageCount, connectionId])

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

      <div className={styles.messages} ref={scrollRef} aria-live="polite">
        {messages.data.length === 0 && (
          <p className={styles.start}>
            You are now study partners with {partner.full_name}. Say hi and agree on a time to
            study together.
          </p>
        )}
        {messages.data.map((message, index) => {
          const mine = message.sender_id === viewerId
          return (
            <Fragment key={message.id}>
              {startsNewDay(messages.data, index) && (
                <span className={styles.day}>{formatDate(message.created_at)}</span>
              )}
              {message.session ? (
                <div className={cx(styles.sessionRow, mine && styles.sessionMine)}>
                  <SessionCard
                    className={styles.session}
                    session={message.session}
                    eyebrow={mine ? 'You proposed a session' : `${partner.full_name} proposed a session`}
                    actions={<SessionActions session={message.session} viewerId={viewerId} />}
                  />
                </div>
              ) : (
                <MessageBubble message={message} mine={mine} />
              )}
            </Fragment>
          )
        })}
      </div>

      <div className={styles.bottom}>
        {proposing ? (
          <ProposeSessionForm
            connectionId={connectionId}
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
        <MessageComposer connectionId={connectionId} />
      </div>
    </section>
  )
}
