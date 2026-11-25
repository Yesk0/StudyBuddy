import { postJson, request } from '@/shared/api'
import type { Connection, Message, Thread } from '../model/types'

export function listConnections(): Promise<Connection[]> {
  return request<Connection[]>('/connections')
}

export function getConnection(connectionId: number): Promise<Connection> {
  return request<Connection>(`/connections/${connectionId}`)
}

function threadPath(thread: Thread): string {
  return `/${thread.kind === 'group' ? 'groups' : 'connections'}/${thread.id}/messages`
}

export function listMessages(
  thread: Thread,
  { limit, beforeId }: { limit: number; beforeId?: number },
): Promise<Message[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (beforeId !== undefined) params.set('before_id', String(beforeId))
  return request<Message[]>(`${threadPath(thread)}?${params}`)
}

export function sendMessage(thread: Thread, body: string): Promise<Message> {
  return postJson<Message>(threadPath(thread), { body })
}
