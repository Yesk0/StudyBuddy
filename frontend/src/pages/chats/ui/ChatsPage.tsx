import { useParams } from 'react-router'
import { cx } from '@/shared/lib'
import { EmptyState } from '@/shared/ui'
import { ChatList } from '@/widgets/chat-list'
import { ChatWindow } from '@/widgets/chat-window'
import styles from './ChatsPage.module.css'

export function ChatsPage() {
  const { connectionId } = useParams()
  const activeId = connectionId ? Number(connectionId) : null

  return (
    <section
      className={cx(styles.layout, activeId ? styles.withChat : styles.withoutChat)}
      data-fill-height
    >
      <aside className={styles.sidebar}>
        <h1 className={styles.sidebarTitle}>Chats</h1>
        <div className={styles.sidebarList}>
          <ChatList />
        </div>
      </aside>
      <div className={styles.content}>
        {activeId ? (
          <ChatWindow key={activeId} connectionId={activeId} />
        ) : (
          <div className={styles.placeholder}>
            <EmptyState
              title="Pick a chat"
              text="Choose a study partner on the left to continue the conversation."
            />
          </div>
        )}
      </div>
    </section>
  )
}
