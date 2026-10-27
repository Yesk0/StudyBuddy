import { useState } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '@/shared/api'
import { ROUTES } from '@/shared/config'
import { FormCard, TextField } from '@/shared/ui'
import { useAuthByEmail } from '../model/useAuthByEmail'
import styles from './AuthForm.module.css'

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const MIN_PASSWORD_LENGTH = 8

type Errors = { email?: string; password?: string; confirm?: string }

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to find study partners for your courses.',
    submit: 'Sign in',
    switchText: 'New to StudyBuddy?',
    switchLink: 'Create an account',
    switchTo: ROUTES.register,
  },
  register: {
    title: 'Create your account',
    subtitle: 'Sign up with your university email. It takes less than two minutes.',
    submit: 'Sign up',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchTo: ROUTES.login,
  },
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const copy = COPY[mode]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const auth = useAuthByEmail(mode)

  const handleSubmit = () => {
    const next: Errors = {}
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email'
    if (password.length < MIN_PASSWORD_LENGTH)
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`
    if (mode === 'register' && confirm !== password) next.confirm = 'Passwords do not match'
    setErrors(next)
    if (Object.keys(next).length === 0) auth.mutate({ email: email.trim(), password })
  }

  return (
    <FormCard
      compact
      title={copy.title}
      subtitle={copy.subtitle}
      submitLabel={copy.submit}
      onSubmit={handleSubmit}
      submitting={auth.isPending}
      error={auth.isError ? errorMessage(auth.error) : null}
      footerStart={
        <p className={styles.switch}>
          {copy.switchText} <Link to={copy.switchTo}>{copy.switchLink}</Link>
        </p>
      }
    >
      <div className={styles.fields}>
        <TextField
          title="University email"
          type="email"
          placeholder="name@university.edu"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(value) => {
            setEmail(value)
            setErrors((current) => ({ ...current, email: undefined }))
          }}
        />
        <TextField
          title="Password"
          type="password"
          placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          value={password}
          error={errors.password}
          onChange={(value) => {
            setPassword(value)
            setErrors((current) => ({ ...current, password: undefined }))
          }}
        />
        {mode === 'register' && (
          <TextField
            title="Repeat password"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={confirm}
            error={errors.confirm}
            onChange={(value) => {
              setConfirm(value)
              setErrors((current) => ({ ...current, confirm: undefined }))
            }}
          />
        )}
      </div>
    </FormCard>
  )
}
