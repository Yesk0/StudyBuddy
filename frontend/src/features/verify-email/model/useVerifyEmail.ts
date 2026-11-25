import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resendVerificationCode, verifyEmail, viewerKeys } from '@/entities/viewer'

export function useVerifyEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: verifyEmail,
    // The refreshed viewer is what moves the user on from the verify screen.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: viewerKeys.me }),
  })
}

export function useResendCode() {
  return useMutation({ mutationFn: resendVerificationCode })
}
