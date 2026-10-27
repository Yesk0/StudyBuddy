import { useQueryClient } from '@tanstack/react-query'
import { setAuthToken } from '@/shared/api'

export function useLogout(): () => void {
  const queryClient = useQueryClient()
  return () => {
    setAuthToken(null)
    queryClient.clear()
  }
}
