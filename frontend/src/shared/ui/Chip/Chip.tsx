import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import styles from './Chip.module.css'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  compact?: boolean
}

export function Chip({ selected = false, compact = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, selected && styles.selected, compact && styles.compact, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

export function ChipGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.group, className].filter(Boolean).join(' ')} {...props} />
}
