import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, register, type Credentials } from '@/entities/viewer'
import { setAuthToken } from '@/shared/api'

export function useAuthByEmail(mode: 'login' | 'register') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      mode === 'login' ? login(credentials) : register(credentials),
    onSuccess: ({ access_token }) => {
      queryClient.clear()
      setAuthToken(access_token)
    },
  })
}
