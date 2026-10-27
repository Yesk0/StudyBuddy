import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Feedback.module.css'

export function Badge({ count, label }: { count: number; label?: string }) {
  if (count <= 0) return null
  return (
    <span className={styles.badge} aria-label={label}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

type AlertProps = {
  tone?: 'error' | 'info' | 'success'
  className?: string
  children: ReactNode
}

export function Alert({ tone = 'info', className, children }: AlertProps) {
  return (
    <div className={cx(styles.alert, styles[tone], className)} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  text?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {text && <p className={styles.emptyText}>{text}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  )
}

export function Spinner() {
  return <span className={styles.spinner} role="status" aria-label="Loading" />
}

export function PageLoader() {
  return (
    <div className={styles.loader}>
      <Spinner />
    </div>
  )
}
