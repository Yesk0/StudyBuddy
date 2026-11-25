import { useState, type ReactNode } from 'react'
import { Button } from './Button'

type ConfirmButtonProps = {
  children: ReactNode
  confirmLabel?: string
  disabled?: boolean
  onConfirm: () => void
}

/** A destructive action that needs a second click, without a browser dialog. */
export function ConfirmButton({
  children,
  confirmLabel = 'Yes, do it',
  disabled,
  onConfirm,
}: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <Button size="sm" variant="ghost" disabled={disabled} onClick={() => setAsking(true)}>
        {children}
      </Button>
    )
  }
  return (
    <>
      <Button
        size="sm"
        variant="danger"
        disabled={disabled}
        onClick={() => {
          setAsking(false)
          onConfirm()
        }}
      >
        {confirmLabel}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
        Keep
      </Button>
    </>
  )
}
