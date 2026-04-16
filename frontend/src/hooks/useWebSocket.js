import { useEffect, useRef, useCallback } from 'react'

const protocol =
  window.location.protocol === 'https:' ? 'wss' : 'ws'

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `${protocol}://${window.location.host}/ws`

export function useWebSocket(onMessage, onStatusChange) {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const onMessageRef = useRef(onMessage)

  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const ws = new WebSocket(`${WS_URL}/tasks`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WS] Connected')
      onStatusChange?.(true)
    }

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      onMessageRef.current(payload)
    }

    ws.onclose = () => {
      onStatusChange?.(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }, [onStatusChange])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return wsRef
}