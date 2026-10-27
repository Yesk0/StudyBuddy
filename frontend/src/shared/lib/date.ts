const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateTime(value: string | Date): string {
  return `${formatDate(value)} · ${formatTime(value)}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

/** Short timestamp for lists: time today, otherwise the date. */
export function formatShortTimestamp(value: string): string {
  const date = new Date(value)
  return isSameDay(date, new Date()) ? formatTime(date) : formatDate(date)
}

/** "in 25 minutes", "in 3 hours", "tomorrow", "2 days ago". */
export function formatFromNow(value: string | Date, now = Date.now()): string {
  const diff = new Date(value).getTime() - now
  const abs = Math.abs(diff)
  if (abs < HOUR) return relative.format(Math.round(diff / MINUTE), 'minute')
  if (abs < DAY) return relative.format(Math.round(diff / HOUR), 'hour')
  return relative.format(Math.round(diff / DAY), 'day')
}

export function addMinutes(value: string | Date, minutes: number): Date {
  return new Date(new Date(value).getTime() + minutes * MINUTE)
}

/** Value for <input type="datetime-local"> in the user's local time zone. */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

export const TIME = { MINUTE, HOUR, DAY }
