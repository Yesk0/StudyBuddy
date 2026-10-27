import { NavLink } from 'react-router'
import { useConnections, type Connection } from '@/entities/connection'
import { useViewer } from '@/entities/viewer'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { cx, formatShortTimestamp } from '@/shared/lib'
import { Alert, Avatar, ButtonLink, EmptyState, PageLoader } from '@/shared/ui'
import styles from './ChatList.module.css'

function preview(connection: Connection, viewerId: number | undefined): string {
  const message = connection.last_message
  if (!message) return connection.shared_courses.length > 0 ? connection.shared_courses.join(', ') : 'Say hi!'
  const prefix = message.sender_id === viewerId ? 'You: ' : ''
  if (message.session) return `${prefix}Proposed “${message.session.title}”`
  return `${prefix}${message.body}`
}

export function ChatList() {
  const { data: viewer } = useViewer()
  const { data: connections, isPending, isError, error } = useConnections()

  if (isPending) return <PageLoader />
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>
  if (connections.length === 0) {
    return (
      <EmptyState
        title="No chats yet"
        text="A chat opens when a study request is accepted."
        action={
          <ButtonLink to={ROUTES.matches} variant="secondary" size="sm">
            Find study partners
          </ButtonLink>
        }
      />
    )
  }

  return (
    <nav className={styles.list} aria-label="Chats">
      {connections.map((connection) => (
        <NavLink
          key={connection.id}
          to={ROUTES.chat(connection.id)}
          className={({ isActive }) => cx(styles.item, isActive && styles.active)}
        >
          <Avatar name={connection.partner.full_name} size={44} />
          <div className={styles.body}>
            <div className={styles.top}>
              <span className={styles.name}>{connection.partner.full_name}</span>
              <span className={styles.time}>
                {formatShortTimestamp(connection.last_message?.created_at ?? connection.created_at)}
              </span>
            </div>
            <p className={styles.preview}>{preview(connection, viewer?.id)}</p>
          </div>
        </NavLink>
      ))}
    </nav>
  )
}
