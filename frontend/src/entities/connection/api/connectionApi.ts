import { postJson, request } from '@/shared/api'
import type { Connection, Message } from '../model/types'

export function listConnections(): Promise<Connection[]> {
  return request<Connection[]>('/connections')
}

export function getConnection(connectionId: number): Promise<Connection> {
  return request<Connection>(`/connections/${connectionId}`)
}

export function listMessages(connectionId: number): Promise<Message[]> {
  return request<Message[]>(`/connections/${connectionId}/messages?limit=200`)
}

export function sendMessage(connectionId: number, body: string): Promise<Message> {
  return postJson<Message>(`/connections/${connectionId}/messages`, { body })
}
