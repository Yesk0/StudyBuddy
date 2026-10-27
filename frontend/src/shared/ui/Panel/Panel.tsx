import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Panel.module.css'

type PageProps = {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function Page({ title, subtitle, actions, className, children }: PageProps) {
  return (
    <section className={cx(styles.page, className)}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

type PanelProps = HTMLAttributes<HTMLDivElement> & { padded?: boolean }

export function Panel({ padded = true, className, ...props }: PanelProps) {
  return <div className={cx(styles.panel, padded && styles.padded, className)} {...props} />
}
