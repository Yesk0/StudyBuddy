import { useId, type InputHTMLAttributes, type Ref } from 'react'
import { cx } from '../../lib/cx'
import styles from './OutlinedField.module.css'

type TextFieldProps =Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  title: string
  legend?: string
  supportingText?: string
  error?: string
  onChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

export function TextField({
  title,
  legend,
  supportingText,
  error,
  onChange,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  const supportingId = `${id}-supporting`
  const supporting = error ?? supportingText

  return (
    <div className={cx(styles.field, error && styles.error, className)}>
      <label htmlFor={id} className={styles.title}>
        {title}
      </label>
      <div className={cx(styles.box, inputProps.readOnly && styles.readOnly)}>
        {legend && <span className={styles.legend}>{legend}</span>}
        <input
          id={id}
          className={styles.control}
          aria-invalid={Boolean(error)}
          aria-describedby={supporting ? supportingId : undefined}
          onChange={(event) => onChange(event.target.value)}
          {...inputProps}
        />
      </div>
      {supporting && (
        <span id={supportingId} className={styles.supporting}>
          {supporting}
        </span>
      )}
    </div>
  )
}
