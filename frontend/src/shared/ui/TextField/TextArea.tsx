import { useId, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import styles from './OutlinedField.module.css'

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  title: string
  supportingText?: string
  error?: string
  onChange: (value: string) => void
}

export function TextArea({ title, supportingText, error, onChange, className, ...props }: TextAreaProps) {
  const id = useId()
  const supporting = error ?? supportingText

  return (
    <div className={cx(styles.field, error && styles.error, className)}>
      <label htmlFor={id} className={styles.title}>
        {title}
      </label>
      <div className={cx(styles.box, styles.multiline)}>
        <textarea
          id={id}
          className={styles.control}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          {...props}
        />
      </div>
      {supporting && <span className={styles.supporting}>{supporting}</span>}
    </div>
  )
}
