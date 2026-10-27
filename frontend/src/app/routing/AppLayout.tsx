import { Outlet } from 'react-router'
import { AppHeader } from '@/widgets/app-header'
import { SessionReminder } from '@/widgets/session-reminder'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <AppHeader variant="app" />
      <main className={styles.main}>
        <SessionReminder />
        <Outlet />
      </main>
    </div>
  )
}
