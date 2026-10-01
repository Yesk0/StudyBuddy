import { useId, type InputHTMLAttributes, type Ref } from 'react'
import styles from './OutlinedField.module.css'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  title: string
  legend?: string
  supportingText?: string
  error?: string
  onChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

export function TextField({
  title,
  legend = 'Label',
  supportingText = 'Supporting text',
  error,
  onChange,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  const supportingId = `${id}-supporting`

  return (
    <div className={[styles.field, error && styles.error, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.title}>
        {title}
      </label>
      <div className={styles.box}>
        <span className={styles.legend}>{legend}</span>
        <input
          id={id}
          className={styles.control}
          aria-invalid={Boolean(error)}
          aria-describedby={supportingId}
          onChange={(event) => onChange(event.target.value)}
          {...inputProps}
        />
      </div>
      <span id={supportingId} className={styles.supporting}>
        {error ?? supportingText}
      </span>
    </div>
  )
}
