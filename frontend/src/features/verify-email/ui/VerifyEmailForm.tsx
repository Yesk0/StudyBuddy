import { useEffect, useState } from 'react'
import { errorMessage } from '@/shared/api'
import { Button, FormCard, TextField } from '@/shared/ui'
import { useResendCode, useVerifyEmail } from '../model/useVerifyEmail'
import styles from './VerifyEmailForm.module.css'

const RESEND_COOLDOWN_SECONDS = 60

function useCountdown(): [number, () => void] {
  const [left, setLeft] = useState(RESEND_COOLDOWN_SECONDS)
  useEffect(() => {
    if (left <= 0) return
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [left])
  return [left, () => setLeft(RESEND_COOLDOWN_SECONDS)]
}

type VerifyEmailFormProps = {
  email: string
  onSwitchAccount: () => void
}

export function VerifyEmailForm({ email, onSwitchAccount }: VerifyEmailFormProps) {
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string>()
  const [cooldown, restartCooldown] = useCountdown()

  const verify = useVerifyEmail()
  const resend = useResendCode()

  const requestNewCode = () =>
    resend.mutate(undefined, {
      onSuccess: () => {
        restartCooldown()
        setCode('')
        verify.reset()
      },
    })

  const handleSubmit = () => {
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Enter the 6-digit code from the email')
      return
    }
    verify.mutate(code)
  }

  return (
    <FormCard
      compact
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email}. It is valid for 15 minutes.`}
      submitLabel="Verify"
      onSubmit={handleSubmit}
      submitting={verify.isPending}
      error={verify.isError ? errorMessage(verify.error) : null}
      footerStart={
        <Button variant="ghost" size="sm" onClick={onSwitchAccount}>
          Use another account
        </Button>
      }
    >
      <TextField
        title="Verification code"
        placeholder="123456"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        value={code}
        error={codeError}
        onChange={(value) => {
          setCode(value.replace(/\D/g, ''))
          setCodeError(undefined)
        }}
      />
      <div className={styles.resend}>
        <span>Didn’t get it? Check spam, or</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={cooldown > 0 || resend.isPending}
          onClick={requestNewCode}
        >
          {cooldown > 0 ? `send a new code in ${cooldown}s` : 'send a new code'}
        </Button>
      </div>
      {resend.isSuccess && <p className={styles.note}>A new code is on its way.</p>}
      {resend.isError && (
        <p className={styles.error} role="alert">
          {errorMessage(resend.error)}
        </p>
      )}
    </FormCard>
  )
}
