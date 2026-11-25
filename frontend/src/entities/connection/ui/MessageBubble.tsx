import { cx, formatTime } from '@/shared/lib'
import type { Message } from '../model/types'
import styles from './MessageBubble.module.css'

type MessageBubbleProps = {
  message: Message
  mine: boolean
  /** Author name, shown in group chats above the first of their consecutive messages. */
  sender?: string
}

export function MessageBubble({ message, mine, sender }: MessageBubbleProps) {
  return (
    <div className={cx(styles.row, mine && styles.mine)}>
      {sender && <span className={styles.sender}>{sender}</span>}
      <p className={styles.bubble}>{message.body}</p>
      <time className={styles.time} dateTime={message.created_at}>
        {formatTime(message.created_at)}
      </time>
    </div>
  )
}
