import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export function Button({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={[styles.primary, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.back} onClick={onClick}>
      <span aria-hidden="true">←</span>
      Back
    </button>
  )
}
