import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'lg' | 'md' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

function buttonClassName(variant: ButtonVariant = 'primary', size: ButtonSize = 'lg') {
  return cx(styles.button, styles[variant], styles[size])
}

export function Button({
  variant = 'primary',
  size = 'lg',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={cx(buttonClassName(variant, size), className)} {...props} />
}

type ButtonLinkProps = {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

export function ButtonLink({ to, variant = 'primary', size = 'md', className, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={cx(buttonClassName(variant, size), className)}>
      {children}
    </Link>
  )
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className={styles.back} onClick={onClick}>
      <span aria-hidden="true">←</span>
      {label}
    </button>
  )
}

export function ForwardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={styles.back}>
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}
