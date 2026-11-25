import type { SessionHost } from '../api/sessionApi'
import type { StudySession } from '../model/types'

/** The pair chat or group a session belongs to. */
export function sessionHost(session: StudySession): SessionHost {
  return session.group_id !== null
    ? { kind: 'group', id: session.group_id }
    : { kind: 'connection', id: session.connection_id! }
}
