import { cx, formatTime } from '@/shared/lib'
import type { Message } from '../model/types'
import styles from './MessageBubble.module.css'

export function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <div className={cx(styles.row, mine && styles.mine)}>
      <p className={styles.bubble}>{message.body}</p>
      <time className={styles.time} dateTime={message.created_at}>
        {formatTime(message.created_at)}
      </time>
    </div>
  )
}
