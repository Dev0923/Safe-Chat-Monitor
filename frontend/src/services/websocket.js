let websocket = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
let isManualDisconnect = false
let reconnectTimer = null
let userId = null
let token = null
let onMessageCallback = null

export const connectWebSocket = (newUserId, newToken, onMessage) => {
  if (websocket && (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING)) {
    return websocket
  }

  // Store credentials for reconnection
  userId = newUserId
  token = newToken
  onMessageCallback = onMessage
  isManualDisconnect = false
  
  const wsUrl = `ws://localhost:8080/ws`
  
  try {
    websocket = new WebSocket(wsUrl)
    
    websocket.onopen = () => {
      console.log('WebSocket connected')
      reconnectAttempts = 0
      
      // Authenticate with the server by sending userId
      websocket.send(JSON.stringify({
        type: 'authenticate',
        userId: userId
      }))
    }
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Handle authentication confirmation
        if (data.type === 'authenticated') {
          console.log('WebSocket authenticated:', data.message)
          return
        }
        
        // Pass other messages to the callback
        if (onMessageCallback) {
          onMessageCallback(data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected')
      websocket = null

      if (!isManualDisconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        // Exponential backoff with jitter: starts at 1s, max 30s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
        const jitter = Math.random() * 1000
        const totalDelay = delay + jitter
        
        console.log(`WebSocket reconnecting in ${Math.round(totalDelay)}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
        
        reconnectTimer = setTimeout(() => {
          connectWebSocket(userId, token, onMessageCallback)
        }, totalDelay)
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('WebSocket: Max reconnection attempts reached')
      }
    }
  } catch (error) {
    console.error('Error connecting to WebSocket:', error)
  }
}

export const disconnectWebSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  
  if (websocket) {
    isManualDisconnect = true

    if (websocket.readyState === WebSocket.CONNECTING) {
      websocket.onopen = () => {
        if (websocket) {
          websocket.close()
        }
      }
      return
    }

    websocket.close()
  }
}

export const sendWebSocketMessage = (message) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message))
  } else {
    console.warn('WebSocket not connected. Message queued or discarded:', message)
  }
}

export const isWebSocketConnected = () => {
  return websocket && websocket.readyState === WebSocket.OPEN
}
