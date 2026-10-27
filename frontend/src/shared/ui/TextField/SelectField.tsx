import { useId } from 'react'
import { cx } from '../../lib/cx'
import styles from './OutlinedField.module.css'

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  title: string
  value: string
  options: SelectOption[]
  placeholder: string
  legend?: string
  supportingText?: string
  error?: string
  className?: string
  onChange: (value: string) => void
}

export function SelectField({
  title,
  value,
  options,
  placeholder,
  legend,
  supportingText,
  error,
  className,
  onChange,
}: SelectFieldProps) {
  const id = useId()
  const supportingId = `${id}-supporting`
  const supporting = error ?? supportingText

  return (
    <div className={cx(styles.field, error && styles.error, className)}>
      <label htmlFor={id} className={styles.title}>
        {title}
      </label>
      <div className={styles.box}>
        {legend && <span className={styles.legend}>{legend}</span>}
        <select
          id={id}
          className={styles.control}
          value={value}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={supporting ? supportingId : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {supporting && (
        <span id={supportingId} className={styles.supporting}>
          {supporting}
        </span>
      )}
    </div>
  )
}
