import { ROUTES } from '@/shared/config'
import type { StudySessionListItem } from '../model/types'

/** "Bob Marley" for pair sessions, "group “DB squad”" for group sessions. */
export function sessionCompanion(session: StudySessionListItem): string {
  if (session.group) return `group “${session.group.name}”`
  return session.partner?.full_name ?? 'your study partner'
}

/** Where the session is discussed: the pair chat or the group page. */
export function sessionThreadPath(session: StudySessionListItem): string {
  return session.group ? ROUTES.group(session.group.id) : ROUTES.chat(session.connection_id!)
}
