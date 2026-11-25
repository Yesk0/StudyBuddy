import { Fragment, useLayoutEffect, useRef, type ReactNode } from 'react'
import { cx, formatDate, isSameDay } from '@/shared/lib'
import { Button } from '@/shared/ui'
import type { Message } from '../model/types'
import { MessageBubble } from './MessageBubble'
import styles from './MessageList.module.css'

type MessageListProps = {
  messages: Message[]
  viewerId: number
  hasMore: boolean
  loadingEarlier: boolean
  onLoadEarlier: () => void
  emptyText: ReactNode
  /** Shown above other people's messages, e.g. in group chats. */
  senderName?: (senderId: number) => string
  renderSession: (message: Message, mine: boolean) => ReactNode
}

function startsNewDay(messages: Message[], index: number): boolean {
  if (index === 0) return true
  return !isSameDay(new Date(messages[index - 1].created_at), new Date(messages[index].created_at))
}

export function MessageList({
  messages,
  viewerId,
  hasMore,
  loadingEarlier,
  onLoadEarlier,
  emptyText,
  senderName,
  renderSession,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const previous = useRef({ firstId: 0, lastId: 0, scrollHeight: 0 })
  const firstId = messages[0]?.id ?? 0
  const lastId = messages[messages.length - 1]?.id ?? 0

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const before = previous.current
    if (lastId !== before.lastId) {
      // New message at the bottom: follow it.
      element.scrollTop = element.scrollHeight
    } else if (firstId !== before.firstId) {
      // Older messages were added on top: keep the same messages in view.
      element.scrollTop += element.scrollHeight - before.scrollHeight
    }
    previous.current = { firstId, lastId, scrollHeight: element.scrollHeight }
  }, [firstId, lastId])

  return (
    <div className={styles.list} ref={scrollRef} aria-live="polite">
      {hasMore && (
        <Button
          className={styles.earlier}
          variant="ghost"
          size="sm"
          disabled={loadingEarlier}
          onClick={onLoadEarlier}
        >
          {loadingEarlier ? 'Loading…' : 'Load earlier messages'}
        </Button>
      )}
      {messages.length === 0 && <p className={styles.empty}>{emptyText}</p>}
      {messages.map((message, index) => {
        const mine = message.sender_id === viewerId
        const showSender =
          senderName && !mine && (index === 0 || messages[index - 1].sender_id !== message.sender_id)
        return (
          <Fragment key={message.id}>
            {startsNewDay(messages, index) && (
              <span className={styles.day}>{formatDate(message.created_at)}</span>
            )}
            {message.session ? (
              <div className={cx(styles.sessionRow, mine && styles.sessionMine)}>
                {renderSession(message, mine)}
              </div>
            ) : (
              <MessageBubble
                message={message}
                mine={mine}
                sender={showSender ? senderName(message.sender_id) : undefined}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
