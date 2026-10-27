import {
  formatSessionTime,
  isSessionInProgress,
  isSessionSoon,
  useSessions,
} from '@/entities/study-session'
import { ROUTES } from '@/shared/config'
import { formatFromNow, useNow } from '@/shared/lib'
import { ButtonLink } from '@/shared/ui'
import styles from './SessionReminder.module.css'

/** In-app reminder for confirmed sessions in the next 24 hours. */
export function SessionReminder() {
  const now = useNow()
  const { data: sessions = [] } = useSessions('upcoming')
  const soon = sessions.filter((session) => isSessionSoon(session, now))
  if (soon.length === 0) return null

  const [next] = soon
  const when = isSessionInProgress(next, now) ? 'is happening now' : `starts ${formatFromNow(next.starts_at, now)}`

  return (
    <aside className={styles.banner} aria-label="Upcoming session reminder" data-reminder>
      <span className={styles.icon} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <p className={styles.text}>
        <strong>{next.title}</strong> with {next.partner.full_name} {when} · {formatSessionTime(next)}
        {soon.length > 1 && <span className={styles.more}> · +{soon.length - 1} more today</span>}
      </p>
      <ButtonLink to={ROUTES.chat(next.connection_id)} size="sm" variant="secondary">
        Open chat
      </ButtonLink>
    </aside>
  )
}
