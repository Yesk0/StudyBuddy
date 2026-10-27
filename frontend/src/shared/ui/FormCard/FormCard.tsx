import type { FormEvent, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { BackButton, Button } from '../Button/Button'
import styles from './FormCard.module.css'

type FormCardProps = {
  title: string
  subtitle: string
  submitLabel: string
  onSubmit: () => void
  onBack?: () => void
  /** Rendered on the left of the footer when there is no Back button. */
  footerStart?: ReactNode
  submitting?: boolean
  error?: string | null
  /** Drops the fixed wizard height, for short forms such as sign-in. */
  compact?: boolean
  children: ReactNode
}

export function FormCard({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onBack,
  footerStart,
  submitting = false,
  error,
  compact = false,
  children,
}: FormCardProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className={cx(styles.card, compact && styles.compact)} noValidate onSubmit={handleSubmit}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
      <div className={styles.body}>{children}</div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.footer}>
        {onBack ? <BackButton onClick={onBack} /> : footerStart}
        <Button type="submit" className={styles.action} disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
