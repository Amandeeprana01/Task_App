import { useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`

export function useWebSocket(onMessage) {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_URL}/tasks`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected to TaskFlow real-time server')
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          onMessageRef.current(payload)
        } catch (e) {
          console.error('[WS] Failed to parse message', e)
        }
      }

      ws.onclose = () => {
        console.log('[WS] Disconnected. Reconnecting in 3s...')
        reconnectTimer.current = setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error('[WS] Error:', err)
        ws.close()
      }
    } catch (e) {
      console.error('[WS] Connection failed:', e)
      reconnectTimer.current = setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  return wsRef
}
