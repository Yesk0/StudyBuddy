import { API_URL } from './httpClient'

export type RealtimeEvent = { type: string; payload: unknown }

const PING_INTERVAL_MS = 25_000
const MAX_RETRY_DELAY_MS = 15_000

function socketUrl(token: string): string {
  const base = API_URL.startsWith('http')
    ? API_URL.replace(/^http/, 'ws')
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${API_URL}`
  return `${base}/ws?token=${encodeURIComponent(token)}`
}

/** Opens the event socket and keeps it alive until the returned function is called. */
export function connectRealtime(
  token: string,
  onEvent: (event: RealtimeEvent) => void,
  onReconnect?: () => void,
): () => void {
  let socket: WebSocket | null = null
  let pingTimer: number | undefined
  let retryTimer: number | undefined
  let retryDelay = 1000
  let closed = false
  let connectedBefore = false

  const open = () => {
    socket = new WebSocket(socketUrl(token))

    socket.onopen = () => {
      retryDelay = 1000
      if (connectedBefore) onReconnect?.()
      connectedBefore = true
      pingTimer = window.setInterval(() => socket?.send('ping'), PING_INTERVAL_MS)
    }

    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data as string) as RealtimeEvent
        if (event.type !== 'pong') onEvent(event)
      } catch {
        // Ignore malformed frames.
      }
    }

    socket.onclose = (event) => {
      window.clearInterval(pingTimer)
      // 1008 = the server rejected the token; retrying will not help.
      if (closed || event.code === 1008) return
      retryTimer = window.setTimeout(open, retryDelay)
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)
    }
  }

  open()

  return () => {
    closed = true
    window.clearInterval(pingTimer)
    window.clearTimeout(retryTimer)
    socket?.close()
  }
}
