import { useId } from 'react'
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
  legend = 'Label',
  supportingText = 'Supporting text',
  error,
  className,
  onChange,
}: SelectFieldProps) {
  const id = useId()
  const supportingId = `${id}-supporting`

  return (
    <div className={[styles.field, error && styles.error, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.title}>
        {title}
      </label>
      <div className={styles.box}>
        <span className={styles.legend}>{legend}</span>
        <select
          id={id}
          className={styles.control}
          value={value}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={supportingId}
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
      <span id={supportingId} className={styles.supporting}>
        {error ?? supportingText}
      </span>
    </div>
  )
}
