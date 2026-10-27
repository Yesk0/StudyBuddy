import { useQuery } from '@tanstack/react-query'
import { listRequests } from '../api/requestApi'
import type { RequestBox } from './types'

export const requestKeys = {
  all: ['requests'] as const,
  box: (box: RequestBox) => ['requests', box] as const,
}

export function useRequests(box: RequestBox) {
  return useQuery({ queryKey: requestKeys.box(box), queryFn: () => listRequests(box) })
}

export function usePendingIncomingCount(): number {
  const { data } = useRequests('incoming')
  return data?.filter((request) => request.status === 'pending').length ?? 0
}
