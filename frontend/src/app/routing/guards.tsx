import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthToken, useViewer } from '@/entities/viewer'
import { useLogout } from '@/features/logout'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { Alert, Button, PageLoader } from '@/shared/ui'
import { useRealtimeEvents } from '../providers/useRealtimeEvents'
import styles from './guards.module.css'

/** Login and registration are only for signed-out visitors. */
export function GuestOnly() {
  const token = useAuthToken()
  const location = useLocation()
  if (token) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? ROUTES.matches} replace />
  }
  return <Outlet />
}

export function RequireAuth() {
  const token = useAuthToken()
  const location = useLocation()
  const viewer = useViewer()
  const logout = useLogout()
  // The server only accepts sockets from verified accounts.
  useRealtimeEvents(viewer.data?.email_verified ? token : null)

  if (!token) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  if (viewer.isPending) return <PageLoader />
  if (viewer.isError) {
    return (
      <div className={styles.error}>
        <Alert tone="error">{errorMessage(viewer.error)}</Alert>
        <div className={styles.errorActions}>
          <Button size="md" onClick={() => viewer.refetch()}>
            Try again
          </Button>
          <Button size="md" variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    )
  }
  return <Outlet />
}

/** New accounts confirm their university email before anything else. */
export function RequireVerified() {
  const { data: viewer } = useViewer()
  if (viewer && !viewer.email_verified) return <Navigate to={ROUTES.verify} replace />
  return <Outlet />
}

/** The verification screen is only for accounts that still need it. */
export function UnverifiedOnly() {
  const { data: viewer } = useViewer()
  if (viewer?.email_verified) {
    return <Navigate to={viewer.has_profile ? ROUTES.matches : ROUTES.onboarding} replace />
  }
  return <Outlet />
}

/** The app itself needs a study profile; new accounts go through the wizard first. */
export function RequireProfile() {
  const { data: viewer } = useViewer()
  if (viewer && !viewer.has_profile) return <Navigate to={ROUTES.onboarding} replace />
  return <Outlet />
}
