import { Link, NavLink } from 'react-router'
import { useMyProfile } from '@/entities/profile'
import { usePendingIncomingCount } from '@/entities/study-request'
import { useLogout } from '@/features/logout'
import { ROUTES } from '@/shared/config'
import { cx } from '@/shared/lib'
import { Avatar, Badge, Button, ProgressBar } from '@/shared/ui'
import styles from './AppHeader.module.css'

type AppHeaderProps =
  | { variant: 'onboarding'; step: number; totalSteps: number }
  | { variant: 'app' }
  | { variant: 'guest' }

function Brand() {
  return (
    <Link to={ROUTES.matches} className={styles.brand}>
      <span className={styles.logo} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      StudyBuddy
    </Link>
  )
}

const navClassName = ({ isActive }: { isActive: boolean }) =>
  cx(styles.navLink, isActive && styles.active)

function AppNavigation() {
  const pendingRequests = usePendingIncomingCount()
  const { data: profile } = useMyProfile()
  const logout = useLogout()

  return (
    <>
      <nav className={styles.nav} aria-label="Main">
        <NavLink to={ROUTES.matches} end className={navClassName}>
          Find partners
        </NavLink>
        <NavLink to={ROUTES.requests} className={navClassName}>
          Requests
          <Badge count={pendingRequests} label={`${pendingRequests} new requests`} />
        </NavLink>
        <NavLink to={ROUTES.chats} className={navClassName}>
          Chats
        </NavLink>
        <NavLink to={ROUTES.sessions} className={navClassName}>
          Sessions
        </NavLink>
      </nav>
      <div className={styles.account}>
        <NavLink
          to={ROUTES.profile}
          className={({ isActive }) => cx(styles.profileLink, isActive && styles.active)}
        >
          <Avatar name={profile?.full_name ?? '?'} size={32} />
          <span className={styles.profileName}>{profile?.full_name ?? 'Profile'}</span>
        </NavLink>
        <Button variant="ghost" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>
    </>
  )
}

export function AppHeader(props: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <Brand />
      {props.variant === 'onboarding' && (
        <div className={styles.progress}>
          <span>
            Step {props.step} of {props.totalSteps}
          </span>
          <ProgressBar value={props.step} max={props.totalSteps} />
        </div>
      )}
      {props.variant === 'app' && <AppNavigation />}
    </header>
  )
}
