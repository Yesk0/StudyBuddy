import type { FormEvent, ReactNode } from 'react'
import { BackButton, Button } from '../Button/Button'
import styles from './FormCard.module.css'

type FormCardProps = {
  title: string
  subtitle: string
  submitLabel: string
  onSubmit: () => void
  onBack?: () => void
  submitting?: boolean
  error?: string | null
  children: ReactNode
}

export function FormCard({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onBack,
  submitting = false,
  error,
  children,
}: FormCardProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className={styles.card} noValidate onSubmit={handleSubmit}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
      <div className={styles.body}>{children}</div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.footer}>
        {onBack && <BackButton onClick={onBack} />}
        <Button type="submit" className={styles.action} disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
