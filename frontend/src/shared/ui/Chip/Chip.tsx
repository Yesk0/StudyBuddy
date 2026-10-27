import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Chip.module.css'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  compact?: boolean
}

export function Chip({ selected = false, compact = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cx(styles.chip, selected && styles.selected, compact && styles.compact, className)}
      {...props}
    />
  )
}

export function ChipGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(styles.group, className)} {...props} />
}

export type TagTone = 'neutral' | 'selected' | 'success' | 'warning' | 'primary' | 'muted'

/** Non-interactive pill for statuses and lists of courses or days. */
export function Tag({ tone = 'neutral', children }: { tone?: TagTone; children: ReactNode }) {
  return <span className={cx(styles.tag, tone !== 'neutral' && styles[`tag-${tone}`])}>{children}</span>
}

export function TagList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(styles.tags, className)} {...props} />
}
