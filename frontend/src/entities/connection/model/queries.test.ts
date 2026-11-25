import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { appendMessageToCache, messageKeys } from './queries'
import type { Message, ThreadMessages } from './types'

function message(id: number, overrides: Partial<Message> = {}): Message {
  return {
    id,
    connection_id: 1,
    group_id: null,
    sender_id: 1,
    body: `Message ${id}`,
    created_at: '2026-11-24T12:00:00Z',
    session: null,
    ...overrides,
  }
}

describe('appendMessageToCache', () => {
  it('adds a message to its own conversation once', () => {
    const client = new QueryClient()
    const key = messageKeys.thread({ kind: 'connection', id: 1 })
    client.setQueryData<ThreadMessages>(key, { messages: [message(1)], hasMore: false })

    appendMessageToCache(client, message(2))
    appendMessageToCache(client, message(2)) // the socket echo of our own message

    expect(client.getQueryData<ThreadMessages>(key)?.messages.map((m) => m.id)).toEqual([1, 2])
  })

  it('routes group messages to the group conversation', () => {
    const client = new QueryClient()
    const groupKey = messageKeys.thread({ kind: 'group', id: 5 })
    client.setQueryData<ThreadMessages>(groupKey, { messages: [], hasMore: false })

    appendMessageToCache(client, message(3, { connection_id: null, group_id: 5 }))

    expect(client.getQueryData<ThreadMessages>(groupKey)?.messages).toHaveLength(1)
  })

  it('ignores conversations that are not loaded', () => {
    const client = new QueryClient()
    appendMessageToCache(client, message(1))
    expect(client.getQueryData(messageKeys.thread({ kind: 'connection', id: 1 }))).toBeUndefined()
  })
})
