import styles from './ProgressBar.module.css'

type ProgressBarProps = {
  value: number
  max: number
}

export function ProgressBar({ value, max }: ProgressBarProps) {
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={styles.fill} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}
