import { downloadIcs, type StudySession } from '@/entities/study-session'
import { Button } from '@/shared/ui'

type AddToCalendarButtonProps = {
  session: StudySession
  /** Partner name or group name, used in the event description. */
  withWhom: string
}

/** Downloads the session as an .ics file that any calendar app can import. */
export function AddToCalendarButton({ session, withWhom }: AddToCalendarButtonProps) {
  if (session.status !== 'accepted') return null
  return (
    <Button size="sm" variant="secondary" onClick={() => downloadIcs(session, withWhom)}>
      Add to calendar
    </Button>
  )
}
