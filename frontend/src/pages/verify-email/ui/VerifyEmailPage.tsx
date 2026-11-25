import { useViewer } from '@/entities/viewer'
import { useLogout } from '@/features/logout'
import { VerifyEmailForm } from '@/features/verify-email'
import { PageLoader } from '@/shared/ui'
import { AppHeader } from '@/widgets/app-header'
import styles from './VerifyEmailPage.module.css'

export function VerifyEmailPage() {
  const { data: viewer } = useViewer()
  const logout = useLogout()

  return (
    <>
      <AppHeader variant="guest" />
      <main className={styles.main}>
        {viewer ? <VerifyEmailForm email={viewer.email} onSwitchAccount={logout} /> : <PageLoader />}
      </main>
    </>
  )
}
