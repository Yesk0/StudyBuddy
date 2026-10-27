import { AuthForm } from '@/features/auth-by-email'
import { AppHeader } from '@/widgets/app-header'
import styles from './AuthPage.module.css'

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  return (
    <>
      <AppHeader variant="guest" />
      <main className={styles.main}>
        <AuthForm mode={mode} />
      </main>
    </>
  )
}

export function LoginPage() {
  return <AuthPage mode="login" />
}

export function RegisterPage() {
  return <AuthPage mode="register" />
}
