'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { PipelineUpdate, NotificationUpdate } from '@/lib/socket'

interface UseWebSocketOptions {
  autoConnect?: boolean
  enableNotifications?: boolean
  enableMonitoring?: boolean
  pipelineIds?: string[]
}

interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastUpdate: string | null
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    enableNotifications = true,
    enableMonitoring = true,
    pipelineIds = []
  } = options

  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null
  })

  const [pipelineUpdates, setPipelineUpdates] = useState<PipelineUpdate[]>([])
  const [notifications, setNotifications] = useState<NotificationUpdate[]>([])
  const [systemAlerts, setSystemAlerts] = useState<Array<{
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp: string
  }>>([])

  const [jenkinsStatus, setJenkinsStatus] = useState<{
    connected: boolean
    lastUpdate: string
    pipelineCount: number
    error?: string
  } | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return

    // Only connect if not already connecting or connected
    if (state.connecting || state.connected) return

    setState(prev => ({ ...prev, connecting: true }))

    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: 3
    })

    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      setState({
        connected: true,
        connecting: false,
        error: null,
        lastUpdate: new Date().toISOString()
      })

      // Join rooms based on options
      if (enableMonitoring) {
        socket.emit('join-monitoring')
      }

      if (enableNotifications) {
        socket.emit('join-notifications')
      }

      // Join specific pipeline rooms
      pipelineIds.forEach(pipelineId => {
        socket.emit('join-pipeline', pipelineId)
      })
    })

    socket.on('disconnect', (reason) => {
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: reason === 'io server disconnect' ? 'Server disconnected' : 'Connection lost'
      }))
    })

    socket.on('connect_error', (error) => {
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error.message
      }))
    })

    // Handle pipeline updates
    socket.on('pipeline-update', (update: PipelineUpdate) => {
      setPipelineUpdates(prev => {
        // Remove previous updates for the same pipeline and add new one
        const filtered = prev.filter(u => u.id !== update.id)
        return [...filtered, update].slice(-50) // Keep last 50 updates
      })
      setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }))
    })

    // Handle bulk pipeline updates
    socket.on('bulk-pipeline-updates', (updates: PipelineUpdate[]) => {
      setPipelineUpdates(prev => {
        const existingIds = new Set(prev.map(u => u.id))
        const newUpdates = updates.filter(u => !existingIds.has(u.id))
        return [...prev, ...newUpdates].slice(-50)
      })
      setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }))
    })

    // Handle notifications
    socket.on('notification', (notification: NotificationUpdate) => {
      setNotifications(prev => [notification, ...prev].slice(0, 100)) // Keep last 100 notifications
      setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }))
    })

    // Handle system alerts
    socket.on('system-alert', (alert) => {
      setSystemAlerts(prev => [alert, ...prev].slice(0, 50)) // Keep last 50 alerts
      setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }))
    })

    // Handle Jenkins status updates
    socket.on('jenkins-status', (status) => {
      setJenkinsStatus(status)
      setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }))
    })

    // Handle log updates (for real-time log viewer)
    socket.on('log-update', (logData) => {
      // This can be used by the LogViewer component for real-time updates
      setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }))
    })

    // Handle failure analysis updates
    socket.on('failure-analysis', (analysis) => {
      // This can be used to update failure analysis in real-time
      setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }))
    })

    // Handle heartbeat
    socket.on('pong', (data) => {
      setState(prev => ({ ...prev, lastUpdate: data.timestamp }))
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [autoConnect, enableNotifications, enableMonitoring, pipelineIds])

  // Update pipeline subscriptions when pipelineIds change
  useEffect(() => {
    if (!socketRef.current || !state.connected) return

    const socket = socketRef.current

    // Leave all pipeline rooms first
    pipelineIds.forEach(pipelineId => {
      socket.emit('leave-pipeline', pipelineId)
    })

    // Join new pipeline rooms
    pipelineIds.forEach(pipelineId => {
      socket.emit('join-pipeline', pipelineId)
    })
  }, [pipelineIds, state.connected])

  // Methods for interacting with the socket
  const joinPipeline = (pipelineId: string) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('join-pipeline', pipelineId)
    }
  }

  const leavePipeline = (pipelineId: string) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('leave-pipeline', pipelineId)
    }
  }

  const sendPipelineUpdate = (update: PipelineUpdate) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('pipeline-update', update)
    }
  }

  const sendNotification = (notification: NotificationUpdate) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('notification', notification)
    }
  }

  const sendSystemAlert = (alert: {
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('system-alert', {
        ...alert,
        timestamp: new Date().toISOString()
      })
    }
  }

  const sendJenkinsStatus = (status: {
    connected: boolean
    pipelineCount: number
    error?: string
  }) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('jenkins-status', {
        ...status,
        lastUpdate: new Date().toISOString()
      })
    }
  }

  const sendLogUpdate = (logData: {
    pipelineId: string
    stage: string
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
    message: string
  }) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('log-update', {
        ...logData,
        timestamp: new Date().toISOString()
      })
    }
  }

  const sendFailureAnalysis = (analysis: {
    pipelineId: string
    failureReason: string
    category: string
    confidence: number
    suggestedActions: string[]
  }) => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('failure-analysis', {
        ...analysis,
        timestamp: new Date().toISOString()
      })
    }
  }

  const ping = () => {
    if (socketRef.current && state.connected) {
      socketRef.current.emit('ping')
    }
  }

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    setState(prev => ({ ...prev, connecting: true }))
    
    // Reconnect after a short delay
    setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.connect()
      }
    }, 1000)
  }

  // Clear old data
  const clearPipelineUpdates = () => setPipelineUpdates([])
  const clearNotifications = () => setNotifications([])
  const clearSystemAlerts = () => setSystemAlerts([])

  return {
    // State
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    lastUpdate: state.lastUpdate,
    
    // Data
    pipelineUpdates,
    notifications,
    systemAlerts,
    jenkinsStatus,
    
    // Methods
    joinPipeline,
    leavePipeline,
    sendPipelineUpdate,
    sendNotification,
    sendSystemAlert,
    sendJenkinsStatus,
    sendLogUpdate,
    sendFailureAnalysis,
    ping,
    reconnect,
    
    // Utility methods
    clearPipelineUpdates,
    clearNotifications,
    clearSystemAlerts
  }
}