import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Layout.module.css'

function cx(...classNames: (string | undefined | false)[]) {
  return classNames.filter(Boolean).join(' ')
}

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx(styles.sectionLabel, className)} {...props} />
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx(styles.divider, className)} />
}

type InfoBoxProps = {
  title?: string
  className?: string
  children: ReactNode
}

export function InfoBox({ title, className, children }: InfoBoxProps) {
  return (
    <div className={cx(styles.infoBox, className)}>
      {title && <p className={styles.infoTitle}>{title}</p>}
      <p>{children}</p>
    </div>
  )
}
